CREATE TABLE IF NOT EXISTS course_video_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  module_index SMALLINT UNSIGNED NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id, module_index),
  CONSTRAINT fk_course_video_progress_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
