CREATE TABLE IF NOT EXISTS course_assessment_results (
  user_id BIGINT UNSIGNED NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  review_json JSON NOT NULL,
  correct_count SMALLINT UNSIGNED NOT NULL,
  total_questions SMALLINT UNSIGNED NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_course_assessment_results_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
