ALTER TABLE users
  ADD COLUMN first_name VARCHAR(255) NOT NULL DEFAULT '' AFTER display_name,
  ADD COLUMN last_name VARCHAR(255) NOT NULL DEFAULT '' AFTER first_name;

UPDATE users
SET first_name = SUBSTRING_INDEX(TRIM(display_name), ' ', 1),
    last_name = TRIM(SUBSTRING(
      TRIM(display_name),
      CHAR_LENGTH(SUBSTRING_INDEX(TRIM(display_name), ' ', 1)) + 2
    ))
WHERE TRIM(display_name) <> '';
