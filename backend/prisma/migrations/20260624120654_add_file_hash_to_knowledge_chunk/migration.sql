ALTER TABLE "knowledge_chunk" ADD COLUMN "file_hash" TEXT;
CREATE INDEX "knowledge_chunk_source_idx" ON "knowledge_chunk"("source");
