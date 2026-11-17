CREATE TABLE IF NOT EXISTS course_enrollments (
  user_id BIGINT UNSIGNED NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_course_enrollments_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
SELECT user_id, course_id, MIN(completed_at)
FROM course_progress
GROUP BY user_id, course_id
ON DUPLICATE KEY UPDATE enrolled_at = LEAST(course_enrollments.enrolled_at, VALUES(enrolled_at));
