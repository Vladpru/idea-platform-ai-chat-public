-- This is an empty migration.-- CreateIndex
CREATE INDEX IF NOT EXISTS idea_fts_idx ON "Idea" 
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));