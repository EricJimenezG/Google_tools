CREATE DATABASE IF NOT EXISTS gtools_academy
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gtools_academy;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  google_sub VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  picture_url VARCHAR(2048) NULL,
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'es',
  preferred_theme VARCHAR(5) NOT NULL DEFAULT 'dark',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_google_sub (google_sub),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_course_progress_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
