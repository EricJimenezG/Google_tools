ALTER TABLE users
  ADD COLUMN preferred_language VARCHAR(5) NOT NULL DEFAULT 'es',
  ADD COLUMN preferred_theme VARCHAR(5) NOT NULL DEFAULT 'dark';
