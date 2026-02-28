ALTER TABLE cards ADD COLUMN created_by INTEGER REFERENCES users(id);

UPDATE cards
SET created_by = (
  SELECT p.user_id
  FROM columns c
  JOIN boards b ON b.id = c.board_id
  JOIN projects p ON p.id = b.project_id
  WHERE c.id = cards.column_id
)
WHERE created_by IS NULL;
