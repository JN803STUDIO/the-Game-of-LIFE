-- =====================================================
-- 인생게임 DB 만들기
-- MySQL Workbench 나 mysql 명령어로 이 파일을 한 번 실행하세요.
-- =====================================================
SET NAMES utf8mb4;   -- 한글이 깨지지 않게

CREATE DATABASE IF NOT EXISTS life_game DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE life_game;

-- 회원
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,   -- 아이디
  email         VARCHAR(100) NOT NULL UNIQUE,   -- 이메일 (아이디 대신 로그인할 때도 씀)
  password_hash CHAR(128)    NOT NULL,          -- 암호화된 비밀번호
  salt          CHAR(32)     NOT NULL,          -- 암호화용 랜덤 값
  nickname      VARCHAR(20)  NOT NULL,          -- 닉네임
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- 로그인 상태 (토큰)
CREATE TABLE IF NOT EXISTS sessions (
  token      CHAR(64) PRIMARY KEY,
  user_id    INT      NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,                      -- 시간 만료
  INDEX idx_sessions_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 이메일 인증번호 (회원가입 · 이메일 변경 · 비밀번호 찾기)
CREATE TABLE IF NOT EXISTS email_codes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(100) NOT NULL,
  purpose    ENUM('register','change','reset') NOT NULL,
  code_hash  CHAR(64)     NOT NULL,                -- 인증번호도 그대로 저장 안 함
  tries      TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 틀린 횟수
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_codes (email, purpose)
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

  game_mode    ENUM('full','junior','adult') NOT NULL DEFAULT 'full',

  rounds       INT NULL,
  talent       ENUM('int','str','sense') NULL,
  married      BOOLEAN     NOT NULL DEFAULT 0,
  kids_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,

  INDEX idx_ranking     (game_mode, total_money),
  INDEX idx_user_recent (user_id, created_at),
  CHECK (rank_pos BETWEEN 1 AND 4),
  CHECK (player_count BETWEEN 1 AND 4),
  CHECK (rank_pos <= player_count),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 이어하기
CREATE TABLE IF NOT EXISTS game_saves (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  slot          TINYINT UNSIGNED NOT NULL DEFAULT 1,
  title         VARCHAR(60) NOT NULL,
  game_mode     ENUM('full','junior','adult') NOT NULL DEFAULT 'full',
  round_no      INT NOT NULL DEFAULT 0,
  player_count  TINYINT UNSIGNED NOT NULL,
  state_version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  state         LONGTEXT NOT NULL,
  saved_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_save_slot (user_id, slot),
  CHECK (slot BETWEEN 1 AND 3),
  CHECK (player_count BETWEEN 1 AND 4),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 보안 로그 (이상한 기록 제출 등)
CREATE TABLE IF NOT EXISTS security_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NULL,
  event_type     VARCHAR(40) NOT NULL,             -- 예) INVALID_RANK, ABNORMAL_ASSET
  severity       ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  reason         VARCHAR(255) NOT NULL,
  submitted_data JSON,                             -- 제출된 값 그대로
  action_taken   VARCHAR(20) NOT NULL,             -- 예) REJECTED
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- =====================================================
-- 조회용 view (백엔드에서 SELECT 만 하면 돼요)
-- =====================================================

-- 랭킹 : 모드별로, 사람마다 최고 기록 1개만
--   SELECT * FROM v_ranking WHERE game_mode = 'full' ORDER BY best_total DESC LIMIT 10;
CREATE OR REPLACE VIEW v_ranking AS
SELECT
  r.game_mode,
  u.id               AS user_id,
  u.nickname,
  MAX(r.total_money) AS best_total,   -- 최고 총자산
  COUNT(*)           AS plays,        -- 이 모드로 한 판 수
  MAX(r.created_at)  AS last_played
FROM records r
JOIN users u ON u.id = r.user_id
GROUP BY r.game_mode, u.id, u.nickname;

-- 내 통계 : 기록이 하나도 없는 사람도 나와요 (0판)
--   SELECT * FROM v_user_stats WHERE user_id = 1;
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  u.id                                                          AS user_id,
  u.nickname,
  COUNT(r.id)                                                   AS plays,        -- 총 판 수
  COALESCE(SUM(r.player_count > 1 AND r.rank_pos = 1), 0)       AS wins,         -- 1등 횟수 (혼자 한 판 제외)
  COALESCE(MAX(r.total_money), 0)                               AS best_total,   -- 최고 총자산
  COALESCE(ROUND(AVG(r.total_money)), 0)                        AS avg_total,    -- 평균 총자산
  MAX(r.created_at)                                             AS last_played
FROM users u
LEFT JOIN records r ON r.user_id = u.id
GROUP BY u.id, u.nickname;
