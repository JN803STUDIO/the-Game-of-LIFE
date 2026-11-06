-- =====================================================
-- 인생게임 DB 만들기
-- MySQL Workbench 나 mysql 명령어로 이 파일을 한 번 실행하세요.
-- =====================================================

CREATE DATABASE IF NOT EXISTS life_game DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE life_game;

-- 회원
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,   -- 아이디
  password_hash CHAR(128)    NOT NULL,          -- 암호화된 비밀번호 (진짜 비밀번호는 저장 안 함!)
  salt          CHAR(32)     NOT NULL,          -- 암호화용 랜덤 값
  nickname      VARCHAR(20)  NOT NULL,          -- 닉네임
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- 로그인 상태 (토큰)
CREATE TABLE IF NOT EXISTS sessions (
  token      CHAR(64) PRIMARY KEY,
  user_id    INT      NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 게임 기록
CREATE TABLE IF NOT EXISTS records (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT         NOT NULL,
  total_money  INT         NOT NULL,   -- 최종 총자산 (만원)
  rank_pos     INT         NOT NULL,   -- 등수
  player_count INT         NOT NULL,   -- 같이 한 인원
  job          VARCHAR(40),            -- 마지막 직업
  created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
