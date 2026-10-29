@echo off
chcp 65001 > nul
cd /d %~dp0backend

if not exist .venv (
  echo [1/2] 처음 실행이라 필요한 프로그램을 설치해요...
  python -m venv .venv
  .venv\Scripts\python -m pip install -r requirements.txt
)

if not exist .env (
  echo .env 파일이 없어요! .env.example 을 복사해서 .env 로 만들고 MySQL 비밀번호를 적어 주세요.
  pause
  exit /b
)

echo [2/2] 서버 실행 중... 브라우저에서 http://localhost:8000 접속!
start http://localhost:8000
.venv\Scripts\python -m uvicorn main:app --reload
