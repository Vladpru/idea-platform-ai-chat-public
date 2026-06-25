ALTER TABLE "knowledge_chunk"
  ADD COLUMN fts_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

CREATE INDEX "knowledge_chunk_fts_idx" ON "knowledge_chunk" USING GIN (fts_vector);
