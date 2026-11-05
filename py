# =====================================================
# 인생게임 서버 (FastAPI + MySQL) - 보안 강화 버전
# =====================================================
import hashlib
import hmac
import os
import secrets
from pathlib import Path
import json

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


# ----- 비밀번호 암호화 -----
def hash_password(password: str, salt: str) -> str:
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


# ----- 로그인 토큰 만들기 -----
def create_session(db, user_id: int) -> str:
    token = secrets.token_hex(32)
    with db.cursor() as cur:
        cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, user_id))
    return token


# ----- 토큰으로 누가 로그인했는지 찾기 -----
def get_current_user(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요해요.")
    token = authorization[len("Bearer "):]

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT u.id, u.username, u.nickname FROM sessions s "
                "JOIN users u ON u.id = s.user_id WHERE s.token = %s",
                (token,),
            )
            user = cur.fetchone()
    finally:
        db.close()

    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 만료됐어요. 다시 로그인해 주세요.")
    return user


# ----- 요청으로 받을 데이터 모양 -----
class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=4, max_length=50)
    nickname: str = Field(min_length=1, max_length=20)


class LoginIn(BaseModel):
    username: str = Field(max_length=30)
    password: str = Field(max_length=50)


class RecordIn(BaseModel):
    total: int
    rank: int = Field(ge=1, le=4)
    players: int = Field(ge=1, le=4)
    job: str = Field(max_length=40)


app = FastAPI(title="인생게임 서버")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 곳에서의 접근 허용
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS 등 모든 요청 허용
    allow_headers=["*"],
)

# backend 폴더(.env 등)는 브라우저에서 못 보게 막기
@app.middleware("http")
async def hide_backend_folder(request: Request, call_next):
    if request.url.path.startswith("/backend"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    return await call_next(request)


# 입력값이 잘못됐을 때 한국어 메시지
@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(
        {"detail": "입력값을 확인해 주세요. (아이디 3자 이상, 비밀번호 4자 이상, 닉네임 1자 이상)"},
        status_code=422,
    )


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


@app.post("/api/register")
def register(data: RegisterIn):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (data.username,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="이미 있는 아이디예요.")

            salt = secrets.token_hex(16)
            cur.execute(
                "INSERT INTO users (username, password_hash, salt, nickname) VALUES (%s, %s, %s, %s)",
                (data.username, hash_password(data.password, salt), salt, data.nickname),
            )
            user_id = cur.lastrowid

        token = create_session(db, user_id)
        return {"token": token, "user": {"id": user_id, "username": data.username, "nickname": data.nickname}}
    finally:
        db.close()


@app.post("/api/login")
def login(data: LoginIn):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE username = %s", (data.username,))
            user = cur.fetchone()

        if user is None or not hmac.compare_digest(hash_password(data.password, user["salt"]), user["password_hash"]):
            raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸어요.")

        token = create_session(db, user["id"])
        return {"token": token, "user": {"id": user["id"], "username": user["username"], "nickname": user["nickname"]}}
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


# =====================================================
# 보안 로그 기록 함수
# =====================================================
def log_security_event(db, user_id: int | None, event_type: str, severity: str, reason: str, submitted_data: dict, action_taken: str):
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO security_logs (user_id, event_type, severity, reason, submitted_data, action_taken)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, event_type, severity, reason, json.dumps(submitted_data, ensure_ascii=False), action_taken)
        )


@app.post("/api/records")
def save_record(data: RecordIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    db = get_db()
    
    try:
        # ----- [보안 검증 로직] -----
        
        # 1. 등수가 인원수보다 큰 경우 (예: 2명이 플레이했는데 3등 제출)
        if data.rank > data.players:
            log_security_event(
                db, user["id"], 
                event_type="INVALID_RANK", 
                severity="MEDIUM",
                reason=f"참가자 수({data.players}명)보다 높은 등수({data.rank}등)를 제출했습니다.",
                submitted_data=data.dict(),
                action_taken="REJECTED"
            )
            raise HTTPException(status_code=400, detail="비정상적인 게임 결과입니다. (등수 오류)")

        # 2. 자산이 비정상적으로 높거나 음수인 경우 (예: 1억 원 초과 또는 음수 자산)
        # 게임 최대 자산 한도를 임의로 1,000,000(백억 원)으로 가정
        if data.total < -10000 or data.total > 1000000:
            log_security_event(
                db, user["id"], 
                event_type="ABNORMAL_ASSET", 
                severity="HIGH",
                reason=f"허용 범위를 벗어난 자산 금액({data.total}만원)이 제출되었습니다.",
                submitted_data=data.dict(),
                action_taken="REJECTED"
            )
            raise HTTPException(status_code=400, detail="비정상적인 자산 데이터가 감지되었습니다.")

        # ----- [정상 기록 저장] -----
        with db.cursor() as cur:
            cur.execute(
                "INSERT INTO records (user_id, total_money, rank_pos, player_count, job) VALUES (%s, %s, %s, %s, %s)",
                (user["id"], data.total, data.rank, data.players, data.job),
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
# =====================================================
app.mount("/", StaticFiles(directory=GAME_DIR, html=True), name="game")
