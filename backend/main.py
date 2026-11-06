# =====================================================
# 인생게임 서버 (FastAPI + MySQL)
#
# 실행 방법 (backend 폴더에서)
#   pip install -r requirements.txt
#   uvicorn main:app --reload
# → 브라우저에서 http://localhost:8000 접속
# =====================================================
import hashlib
import hmac
import json
import os
import re
import secrets
import smtplib
from email.message import EmailMessage
from pathlib import Path
from typing import Literal

import dns.exception
import dns.resolver
import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BACKEND_DIR = Path(__file__).resolve().parent   # backend 폴더
GAME_DIR = BACKEND_DIR.parent                   # 인생게임 폴더 (index.html 있는 곳)

# .env 파일에서 DB 접속 정보 읽기
load_dotenv(BACKEND_DIR / ".env")


# ----- DB 연결 -----
def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "life_game"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,  # 결과를 딕셔너리로 받기
        autocommit=True,
    )


# ----- 비밀번호 암호화 -----
# 비밀번호를 그대로 저장하면 DB가 털렸을 때 위험해요.
# salt(랜덤 값)를 섞어서 되돌릴 수 없는 값으로 바꿔 저장해요.
def hash_password(password: str, salt: str) -> str:
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


# ----- 로그인 토큰 만들기 -----
SESSION_DAYS = 7   # 로그인 유지 기간 (일)


def create_session(db, user_id: int) -> str:
    token = secrets.token_hex(32)
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (%s, %s, NOW() + INTERVAL %s DAY)",
            (token, user_id, SESSION_DAYS),
        )
    return token


# ----- 관리자 -----
# 아이디가 admin 인 계정이 관리자예요.
# 아무나 admin 으로 가입하면 안 되니까, admin 가입은 서버 컴퓨터(localhost)에서만 받아요.
ADMIN_USERNAME = "admin"


def is_admin_name(username: str) -> bool:
    return username.lower() == ADMIN_USERNAME   # DB 가 대소문자를 안 가려서 Admin 도 같은 아이디


# ----- 토큰으로 누가 로그인했는지 찾기 -----
def get_current_user(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요해요.")
    token = authorization[len("Bearer "):]

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT u.id, u.username, u.email, u.nickname FROM sessions s "
                "JOIN users u ON u.id = s.user_id "
                "WHERE s.token = %s AND (s.expires_at IS NULL OR s.expires_at > NOW())",
                (token,),
            )
            user = cur.fetchone()
    finally:
        db.close()

    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 만료됐어요. 다시 로그인해 주세요.")
    user["is_admin"] = is_admin_name(user["username"])
    return user


def require_admin(authorization: str | None) -> dict:
    user = get_current_user(authorization)
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="관리자만 할 수 있어요.")
    return user


# ----- 메일 보내기 -----
# .env 에 SMTP 설정이 없으면 (테스트 모드) 메일 대신 서버 창에 내용을 찍어요.
def send_mail(to: str, subject: str, body: str):
    host = os.getenv("SMTP_HOST")
    if not host:
        print(f"\n[메일 테스트 모드] 받는 사람: {to}\n제목: {subject}\n{body}\n", flush=True)
        return
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_FROM") or os.getenv("SMTP_USER")
    msg["To"] = to
    msg.set_content(body)
    try:
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as smtp:
            smtp.starttls()
            smtp.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
            smtp.send_message(msg)
    except (smtplib.SMTPException, OSError):
        raise HTTPException(status_code=502, detail="메일을 보내지 못했어요. 잠시 후 다시 해 주세요.")


# ----- 이메일 인증번호 -----
CODE_MINUTES = 10   # 인증번호 유효 시간 (분)
CODE_TRIES = 5      # 틀려도 되는 횟수
CODE_TITLES = {"register": "회원가입", "change": "이메일 변경", "reset": "비밀번호 찾기"}


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def send_code(db, email: str, purpose: str):
    with db.cursor() as cur:
        # 1분에 한 번만 보내기 (메일 폭탄 막기)
        cur.execute(
            "SELECT id FROM email_codes WHERE email = %s AND purpose = %s AND created_at > NOW() - INTERVAL 1 MINUTE",
            (email, purpose),
        )
        if cur.fetchone():
            fail("인증번호는 1분에 한 번만 받을 수 있어요. 잠시 후 다시 눌러 주세요.", 429)

        code = f"{secrets.randbelow(1000000):06d}"
        cur.execute("DELETE FROM email_codes WHERE email = %s AND purpose = %s", (email, purpose))
        cur.execute(
            "INSERT INTO email_codes (email, purpose, code_hash, expires_at) VALUES (%s, %s, %s, NOW() + INTERVAL %s MINUTE)",
            (email, purpose, hash_code(code), CODE_MINUTES),
        )
    send_mail(
        email,
        f"[인생게임] {CODE_TITLES[purpose]} 인증번호",
        f"인증번호는 {code} 예요.\n{CODE_MINUTES}분 안에 입력해 주세요.\n직접 요청하지 않았다면 이 메일은 무시하세요.",
    )


def use_code(db, email: str, purpose: str, code: str):
    """인증번호가 맞으면 지우고 통과, 틀리면 상황에 맞는 오류"""
    code = code.strip()
    if not code:
        fail("인증번호를 입력해 주세요.")
    with db.cursor() as cur:
        cur.execute(
            "SELECT id, code_hash, tries, expires_at < NOW() AS expired FROM email_codes "
            "WHERE email = %s AND purpose = %s",
            (email, purpose),
        )
        row = cur.fetchone()
        if row is None:
            fail("인증번호를 먼저 받아 주세요.")
        if row["expired"]:
            fail("인증번호 시간이 지났어요. 다시 받아 주세요.")
        if row["tries"] >= CODE_TRIES:
            fail("인증번호를 너무 많이 틀렸어요. 다시 받아 주세요.")
        if not hmac.compare_digest(hash_code(code), row["code_hash"]):
            cur.execute("UPDATE email_codes SET tries = tries + 1 WHERE id = %s", (row["id"],))
            fail("인증번호가 틀렸어요.")
        cur.execute("DELETE FROM email_codes WHERE id = %s", (row["id"],))


# ----- 요청으로 받을 데이터 모양 -----
# 길이 · 글자 검사는 각 API 안에서 상황마다 다른 메시지로 해요
class RegisterIn(BaseModel):
    username: str
    email: str
    code: str = ""
    password: str
    nickname: str


class LoginIn(BaseModel):
    username: str = Field(max_length=100)   # 아이디 또는 이메일
    password: str = Field(max_length=50)


class EmailIn(BaseModel):
    email: str


class UsernameIn(BaseModel):
    username: str


class PasswordCodeIn(BaseModel):
    username: str
    email: str


class PasswordResetIn(BaseModel):
    username: str
    email: str
    code: str
    new_password: str


class UpdateMeIn(BaseModel):
    current_password: str
    nickname: str | None = None
    email: str | None = None
    code: str = ""
    new_password: str | None = None


class DeleteMeIn(BaseModel):
    password: str


class AdminPasswordIn(BaseModel):
    admin_password: str   # 관리자 본인 비밀번호 (한 번 더 확인)
    new_password: str     # 회원에게 새로 정해 줄 비밀번호


class SaveIn(BaseModel):
    game_uid: str = Field(min_length=1, max_length=32)   # 같은 게임이면 덮어쓰기
    title: str = Field(max_length=60)
    mode: Literal["full", "junior", "adult"]
    round: int = Field(ge=0)
    players: int = Field(ge=1, le=4)
    state: str = Field(max_length=20_000_000)   # 게임 상태 JSON (캐릭터 사진이 들어가면 커져요)


class RecordIn(BaseModel):
    total: int
    rank: int = Field(ge=1, le=4)
    players: int = Field(ge=1, le=4)
    job: str = Field(max_length=40)
    mode: Literal["full", "junior", "adult"] = "full"
    rounds: int | None = Field(default=None, ge=0)
    talent: Literal["int", "str", "sense"] | None = None
    married: bool = False
    kids: int = Field(default=0, ge=0, le=10)


app = FastAPI(title="인생게임 서버")


# backend 폴더(.env 등)는 브라우저에서 못 보게 막기
@app.middleware("http")
async def hide_backend_folder(request: Request, call_next):
    if request.url.path.startswith("/backend"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    return await call_next(request)


# 입력값이 잘못됐을 때 한국어 메시지
@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse({"detail": "입력값을 확인해 주세요."}, status_code=422)


# MySQL 이 꺼져 있거나 설정이 틀렸을 때
@app.exception_handler(pymysql.err.OperationalError)
async def db_error(request: Request, exc: pymysql.err.OperationalError):
    return JSONResponse({"detail": "DB에 연결할 수 없어요. MySQL과 .env 설정을 확인해 주세요."}, status_code=503)


# =====================================================
# API
# =====================================================

@app.get("/api/health")
def health():
    return {"ok": True}


# ----- 입력 검사 (틀리면 상황에 맞는 메시지) -----
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9]+$")                               # 영문 · 숫자만
EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$")


def fail(message: str, status: int = 400):
    raise HTTPException(status_code=status, detail=message)


def email_domain_exists(domain: str) -> bool:
    """메일을 받을 수 있는 도메인인지 DNS 로 확인 (MX, 없으면 A 레코드)"""
    for kind in ("MX", "A"):
        try:
            dns.resolver.resolve(domain, kind, lifetime=5)
            return True
        except dns.resolver.NXDOMAIN:
            return False          # 없는 도메인
        except dns.resolver.NoAnswer:
            continue              # MX 가 없으면 A 레코드로 한 번 더
        except (dns.exception.Timeout, dns.resolver.NoNameservers):
            return True           # DNS 서버 문제로 확인 못 하면 막지 않기
    return False


def check_username(username: str):
    if not username:
        fail("아이디를 입력해 주세요.")
    if not USERNAME_PATTERN.match(username):
        fail("아이디는 영문과 숫자만 쓸 수 있어요. (한글, 특수문자, 띄어쓰기 안 돼요)")
    if not 3 <= len(username) <= 30:
        fail("아이디는 3~30자로 만들어 주세요.")


def check_email(email: str):
    if not email:
        fail("이메일을 입력해 주세요.")
    if len(email) > 100 or not EMAIL_PATTERN.match(email):
        fail("이메일 형식이 아니에요. (예: name@example.com)")
    if not email_domain_exists(email.split("@")[1]):
        fail("존재하지 않는 이메일 주소예요. @ 뒤의 주소를 확인해 주세요.")


def check_password(password: str, label: str = "비밀번호"):
    if not password:
        fail(label + "를 입력해 주세요.")
    if not 4 <= len(password) <= 50:
        fail(label + "는 4~50자로 만들어 주세요.")


def check_nickname(nickname: str):
    if not nickname:
        fail("닉네임을 입력해 주세요.")
    if len(nickname) > 20:
        fail("닉네임은 20자까지 쓸 수 있어요.")


def email_taken(db, email: str) -> bool:
    with db.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        return cur.fetchone() is not None


def password_ok(user: dict, password: str) -> bool:
    # compare_digest = 해킹에 안전한 비교
    return hmac.compare_digest(hash_password(password, user["salt"]), user["password_hash"])


def set_password(db, user_id: int, password: str):
    salt = secrets.token_hex(16)
    with db.cursor() as cur:
        cur.execute("UPDATE users SET password_hash = %s, salt = %s WHERE id = %s",
                    (hash_password(password, salt), salt, user_id))


def user_json(user: dict) -> dict:
    return {"id": user["id"], "username": user["username"], "email": user["email"], "nickname": user["nickname"],
            "is_admin": is_admin_name(user["username"])}


def check_new_username(db, username: str, request: Request):
    """새로 가입할 아이디 검사 (규칙 · admin · 중복)"""
    check_username(username)
    if is_admin_name(username) and request.client.host not in ("127.0.0.1", "::1"):
        fail("admin 아이디는 서버 컴퓨터에서만 만들 수 있어요.", 403)
    with db.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            fail("이미 있는 아이디예요.", 409)


# ----- 회원가입 -----
@app.post("/api/check-username")
def check_username_api(data: UsernameIn, request: Request):
    """아이디 중복확인"""
    db = get_db()
    try:
        check_new_username(db, data.username.strip(), request)
    finally:
        db.close()
    return {"ok": True}


@app.post("/api/email-code")
def email_code(data: EmailIn):
    """회원가입용 인증번호 보내기"""
    email = data.email.strip().lower()
    check_email(email)
    db = get_db()
    try:
        if email_taken(db, email):
            fail("이미 가입된 이메일이에요.", 409)
        send_code(db, email, "register")
    finally:
        db.close()
    return {"ok": True}


@app.post("/api/register")
def register(data: RegisterIn, request: Request):
    username = data.username.strip()
    email = data.email.strip().lower()
    nickname = data.nickname.strip()
    check_username(username)
    check_email(email)
    check_password(data.password)
    check_nickname(nickname)

    db = get_db()
    try:
        check_new_username(db, username, request)
        if email_taken(db, email):
            fail("이미 가입된 이메일이에요.", 409)
        use_code(db, email, "register", data.code)   # 이메일로 받은 인증번호가 맞아야 가입

        salt = secrets.token_hex(16)
        with db.cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, email, password_hash, salt, nickname) VALUES (%s, %s, %s, %s, %s)",
                (username, email, hash_password(data.password, salt), salt, nickname),
            )
            user_id = cur.lastrowid

        token = create_session(db, user_id)
        return {"token": token, "user": {"id": user_id, "username": username, "email": email, "nickname": nickname,
                                         "is_admin": is_admin_name(username)}}
    finally:
        db.close()


# ----- 로그인 / 로그아웃 -----
@app.post("/api/login")
def login(data: LoginIn):
    db = get_db()
    try:
        with db.cursor() as cur:
            # @ 가 있으면 이메일로, 없으면 아이디로 찾기
            if "@" in data.username:
                cur.execute("SELECT * FROM users WHERE email = %s", (data.username.strip().lower(),))
            else:
                cur.execute("SELECT * FROM users WHERE username = %s", (data.username.strip(),))
            user = cur.fetchone()

        if user is None or not password_ok(user, data.password):
            fail("아이디(이메일) 또는 비밀번호가 틀렸어요.", 401)

        token = create_session(db, user["id"])
        return {"token": token, "user": user_json(user)}
    finally:
        db.close()


@app.get("/api/me")
def me(authorization: str | None = Header(default=None)):
    return get_current_user(authorization)


@app.post("/api/logout")
def logout(authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    token = authorization[len("Bearer "):]
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE token = %s AND user_id = %s", (token, user["id"]))
    finally:
        db.close()
    return {"ok": True}


# ----- 아이디 찾기 / 비밀번호 찾기 -----
@app.post("/api/find-id")
def find_id(data: EmailIn):
    """가입한 이메일로 아이디를 보내 줘요"""
    email = data.email.strip().lower()
    if not email:
        fail("이메일을 입력해 주세요.")
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT username FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
    finally:
        db.close()
    if user is None:
        fail("가입되지 않은 이메일이에요.", 404)
    send_mail(email, "[인생게임] 아이디 찾기", f"가입하신 아이디는 {user['username']} 예요.")
    return {"ok": True}


def find_user_by_id_email(db, username: str, email: str) -> dict:
    if not username:
        fail("아이디를 입력해 주세요.")
    if not email:
        fail("이메일을 입력해 주세요.")
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE username = %s AND email = %s", (username, email))
        user = cur.fetchone()
    if user is None:
        fail("아이디와 이메일이 맞지 않아요.", 404)
    return user


@app.post("/api/password-code")
def password_code(data: PasswordCodeIn):
    """비밀번호 찾기용 인증번호 보내기"""
    email = data.email.strip().lower()
    db = get_db()
    try:
        find_user_by_id_email(db, data.username.strip(), email)
        send_code(db, email, "reset")
    finally:
        db.close()
    return {"ok": True}


@app.post("/api/password-reset")
def password_reset(data: PasswordResetIn):
    email = data.email.strip().lower()
    db = get_db()
    try:
        user = find_user_by_id_email(db, data.username.strip(), email)
        check_password(data.new_password, "새 비밀번호")   # 인증번호를 쓰기 전에 검사 (틀려도 다시 시도할 수 있게)
        use_code(db, email, "reset", data.code)
        set_password(db, user["id"], data.new_password)
        with db.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE user_id = %s", (user["id"],))   # 다른 곳 로그인은 끊기
    finally:
        db.close()
    return {"ok": True}


# ----- 내 정보 수정 / 회원탈퇴 (현재 비밀번호 확인 필요) -----
def load_user_with_password(db, user_id: int, password: str) -> dict:
    if not password:
        fail("현재 비밀번호를 입력해 주세요.")
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
    if not password_ok(user, password):
        fail("현재 비밀번호가 틀렸어요.", 401)
    return user


@app.post("/api/me/email-code")
def me_email_code(data: EmailIn, authorization: str | None = Header(default=None)):
    """이메일 바꿀 때 새 이메일로 인증번호 보내기"""
    user = get_current_user(authorization)
    email = data.email.strip().lower()
    if email == user["email"]:
        fail("지금 쓰고 있는 이메일이에요.")
    check_email(email)
    db = get_db()
    try:
        if email_taken(db, email):
            fail("이미 가입된 이메일이에요.", 409)
        send_code(db, email, "change")
    finally:
        db.close()
    return {"ok": True}


@app.post("/api/me/update")
def update_me(data: UpdateMeIn, authorization: str | None = Header(default=None)):
    me_now = get_current_user(authorization)
    nickname = data.nickname.strip() if data.nickname is not None else me_now["nickname"]
    email = data.email.strip().lower() if data.email is not None else me_now["email"]
    check_nickname(nickname)
    if data.new_password:
        check_password(data.new_password, "새 비밀번호")

    db = get_db()
    try:
        user = load_user_with_password(db, me_now["id"], data.current_password)
        if email != user["email"]:
            check_email(email)
            if email_taken(db, email):
                fail("이미 가입된 이메일이에요.", 409)
            use_code(db, email, "change", data.code)
        with db.cursor() as cur:
            cur.execute("UPDATE users SET nickname = %s, email = %s WHERE id = %s", (nickname, email, user["id"]))
        if data.new_password:
            set_password(db, user["id"], data.new_password)
    finally:
        db.close()
    return {"id": me_now["id"], "username": me_now["username"], "email": email, "nickname": nickname,
            "is_admin": me_now["is_admin"]}


@app.post("/api/me/delete")
def delete_me(data: DeleteMeIn, authorization: str | None = Header(default=None)):
    me_now = get_current_user(authorization)
    db = get_db()
    try:
        load_user_with_password(db, me_now["id"], data.password)
        with db.cursor() as cur:
            # 세션 · 기록 · 이어하기는 FOREIGN KEY ... ON DELETE CASCADE 로 같이 지워져요
            cur.execute("DELETE FROM users WHERE id = %s", (me_now["id"],))
    finally:
        db.close()
    return {"ok": True}


# ----- 이어하기 (게임마다 하나씩 쌓이고 같은 게임은 덮어쓰기, 한 사람당 최근 MAX_SAVES 개까지) -----
MAX_SAVES = 30


@app.get("/api/saves")
def list_saves(authorization: str | None = Header(default=None)):
    """저장 목록 (게임 내용 state 는 빼고, 최근 것부터)"""
    user = get_current_user(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT id, title, game_mode, round_no, player_count, saved_at FROM game_saves "
                "WHERE user_id = %s ORDER BY saved_at DESC, id DESC",
                (user["id"],),
            )
            rows = cur.fetchall()
    finally:
        db.close()
    for row in rows:
        row["saved_at"] = row["saved_at"].strftime("%Y-%m-%d %H:%M")
    return rows


@app.get("/api/saves/{save_id}")
def load_save(save_id: int, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT id, title, state FROM game_saves WHERE id = %s AND user_id = %s", (save_id, user["id"]))
            row = cur.fetchone()
    finally:
        db.close()
    if row is None:
        fail("저장한 게임을 찾을 수 없어요.", 404)
    return row


@app.post("/api/saves")
def write_save(data: SaveIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            # 같은 게임(game_uid)이 이미 있으면 덮어쓰고 시간도 새로 (id = LAST_INSERT_ID(id) : 원래 번호 돌려받기)
            cur.execute(
                "INSERT INTO game_saves (user_id, game_uid, title, game_mode, round_no, player_count, state) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), title = VALUES(title), game_mode = VALUES(game_mode), "
                "round_no = VALUES(round_no), player_count = VALUES(player_count), state = VALUES(state), "
                "saved_at = CURRENT_TIMESTAMP",
                (user["id"], data.game_uid, data.title, data.mode, data.round, data.players, data.state),
            )
            save_id = cur.lastrowid
            # 너무 많이 쌓이면 오래된 것부터 지우기
            cur.execute(
                "DELETE FROM game_saves WHERE user_id = %s AND id NOT IN ("
                "SELECT id FROM (SELECT id FROM game_saves WHERE user_id = %s ORDER BY saved_at DESC, id DESC LIMIT %s) AS keep)",
                (user["id"], user["id"], MAX_SAVES),
            )
    finally:
        db.close()
    return {"id": save_id}


@app.post("/api/saves/{save_id}/delete")
def delete_save(save_id: int, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("DELETE FROM game_saves WHERE id = %s AND user_id = %s", (save_id, user["id"]))
    finally:
        db.close()
    return {"ok": True}


# ----- 관리자 : 회원 · 게임 기록 · 보안 로그 · 관리 기록 -----
def log_admin(db, admin: dict, action: str, request: Request, target: str | None = None, detail: str | None = None):
    """관리자가 한 일 남기기 (비밀번호는 절대 넣지 않기)"""
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO admin_logs (admin_id, admin_username, action, target_username, detail, ip) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (admin["id"], admin["username"], action, target, detail, request.client.host),
        )


def find_username(db, user_id: int) -> str:
    with db.cursor() as cur:
        cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    if row is None:
        fail("회원을 찾을 수 없어요.", 404)
    return row["username"]

def dates_to_text(rows: list, *keys: str) -> list:
    for row in rows:
        for key in keys:
            if row[key] is not None:
                row[key] = row[key].strftime("%Y-%m-%d %H:%M")
    return rows


@app.get("/api/admin/users")
def admin_users(authorization: str | None = Header(default=None)):
    require_admin(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT u.id, u.username, u.nickname, u.email, u.created_at, "
                "(SELECT COUNT(*) FROM records r WHERE r.user_id = u.id) AS plays, "
                "(SELECT COUNT(*) FROM game_saves g WHERE g.user_id = u.id) AS saves "
                "FROM users u ORDER BY u.id DESC"
            )
            rows = cur.fetchall()
    finally:
        db.close()
    return dates_to_text(rows, "created_at")


@app.post("/api/admin/users/{user_id}/delete")
def admin_delete_user(user_id: int, request: Request, authorization: str | None = Header(default=None)):
    admin = require_admin(authorization)
    if user_id == admin["id"]:
        fail("관리자 자신은 여기서 지울 수 없어요.")
    db = get_db()
    try:
        target = find_username(db, user_id)
        with db.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))   # 기록 · 저장 · 세션도 같이 지워져요
        log_admin(db, admin, "DELETE_USER", request, target)
    finally:
        db.close()
    return {"ok": True}


@app.post("/api/admin/users/{user_id}/password")
def admin_reset_password(user_id: int, data: AdminPasswordIn, request: Request,
                         authorization: str | None = Header(default=None)):
    """회원 비밀번호를 새로 정해 주기 (원래 비밀번호는 되돌릴 수 없게 저장돼서 볼 수는 없어요)"""
    admin = require_admin(authorization)
    db = get_db()
    try:
        target = find_username(db, user_id)
        try:
            load_user_with_password(db, admin["id"], data.admin_password)   # 관리자 비밀번호 한 번 더
        except HTTPException:
            log_admin(db, admin, "ADMIN_PW_FAIL", request, target, "비밀번호 변경 시도 중 관리자 비밀번호 틀림")
            fail("관리자 비밀번호가 틀렸어요.", 401)
        check_password(data.new_password, "새 비밀번호")
        set_password(db, user_id, data.new_password)
        with db.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))   # 그 회원은 다시 로그인해야
        log_admin(db, admin, "RESET_PASSWORD", request, target, "새 비밀번호로 변경, 로그인 끊음")
    finally:
        db.close()
    return {"ok": True}


@app.get("/api/admin/records")
def admin_records(authorization: str | None = Header(default=None)):
    require_admin(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT r.id, u.username, u.nickname, r.total_money, r.rank_pos, r.player_count, r.job, "
                "r.game_mode, r.created_at FROM records r JOIN users u ON u.id = r.user_id "
                "ORDER BY r.id DESC LIMIT 200"
            )
            rows = cur.fetchall()
    finally:
        db.close()
    return dates_to_text(rows, "created_at")


@app.post("/api/admin/records/{record_id}/delete")
def admin_delete_record(record_id: int, request: Request, authorization: str | None = Header(default=None)):
    admin = require_admin(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT u.username, r.total_money FROM records r JOIN users u ON u.id = r.user_id WHERE r.id = %s",
                (record_id,),
            )
            row = cur.fetchone()
            cur.execute("DELETE FROM records WHERE id = %s", (record_id,))
        if row is not None:
            log_admin(db, admin, "DELETE_RECORD", request, row["username"],
                      f"기록 {record_id}번 ({row['total_money']}만원)")
    finally:
        db.close()
    return {"ok": True}


@app.get("/api/admin/logs")
def admin_logs(authorization: str | None = Header(default=None)):
    require_admin(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT id, admin_username, action, target_username, detail, ip, created_at "
                "FROM admin_logs ORDER BY id DESC LIMIT 200"
            )
            rows = cur.fetchall()
    finally:
        db.close()
    return dates_to_text(rows, "created_at")


@app.get("/api/admin/security-logs")
def admin_security_logs(authorization: str | None = Header(default=None)):
    require_admin(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT l.id, u.username, l.event_type, l.severity, l.reason, l.action_taken, l.created_at "
                "FROM security_logs l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 200"
            )
            rows = cur.fetchall()
    finally:
        db.close()
    return dates_to_text(rows, "created_at")


# ----- 보안 로그 남기기 -----
def log_security_event(db, user_id: int | None, event_type: str, severity: str, reason: str, submitted_data: dict, action_taken: str):
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO security_logs (user_id, event_type, severity, reason, submitted_data, action_taken) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, event_type, severity, reason, json.dumps(submitted_data, ensure_ascii=False), action_taken),
        )


# 기록으로 인정하는 총자산 범위 (만원) : -1억 ~ 100억
MIN_TOTAL = -10000
MAX_TOTAL = 1000000


@app.post("/api/records")
def save_record(data: RecordIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    db = get_db()
    try:
        # 1. 등수가 인원수보다 큰 경우 (예: 2명이 했는데 3등)
        if data.rank > data.players:
            log_security_event(
                db, user["id"], "INVALID_RANK", "MEDIUM",
                f"참가자 수({data.players}명)보다 높은 등수({data.rank}등)를 제출했습니다.",
                data.model_dump(), "REJECTED",
            )
            raise HTTPException(status_code=400, detail="비정상적인 게임 결과입니다. (등수 오류)")

        # 2. 총자산이 말이 안 되게 크거나 작은 경우
        if data.total < MIN_TOTAL or data.total > MAX_TOTAL:
            log_security_event(
                db, user["id"], "ABNORMAL_ASSET", "HIGH",
                f"허용 범위를 벗어난 자산 금액({data.total}만원)이 제출되었습니다.",
                data.model_dump(), "REJECTED",
            )
            raise HTTPException(status_code=400, detail="비정상적인 자산 데이터가 감지되었습니다.")

        with db.cursor() as cur:
            cur.execute(
                "INSERT INTO records (user_id, total_money, rank_pos, player_count, job, "
                "game_mode, rounds, talent, married, kids_count) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (user["id"], data.total, data.rank, data.players, data.job,
                 data.mode, data.rounds, data.talent, data.married, data.kids),
            )
    finally:
        db.close()
    return {"ok": True}


@app.get("/api/ranking")
def ranking():
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT u.nickname, r.total_money, r.job, r.created_at FROM records r "
                "JOIN users u ON u.id = r.user_id ORDER BY r.total_money DESC LIMIT 10"
            )
            rows = cur.fetchall()
    finally:
        db.close()
    for row in rows:
        row["created_at"] = str(row["created_at"])
    return rows


@app.get("/api/my-records")
def my_records(authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT total_money, rank_pos, player_count, job, created_at FROM records "
                "WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
                (user["id"],),
            )
            rows = cur.fetchall()
    finally:
        db.close()
    for row in rows:
        row["created_at"] = str(row["created_at"])
    return rows


# =====================================================
# 게임 화면 (index.html, js, css, 그림) 보여주기
# ※ 반드시 API 아래에 있어야 해요
# =====================================================
app.mount("/", StaticFiles(directory=GAME_DIR, html=True), name="game")
