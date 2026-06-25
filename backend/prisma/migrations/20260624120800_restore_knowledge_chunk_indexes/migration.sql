CREATE INDEX "knowledge_chunk_embedding_hnsw_idx"
    ON "knowledge_chunk" USING hnsw (embedding vector_cosine_ops);
