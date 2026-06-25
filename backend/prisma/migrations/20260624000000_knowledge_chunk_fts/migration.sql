CREATE TABLE "knowledge_chunk" (
    "id"         TEXT NOT NULL,
    "source"     TEXT NOT NULL,
    "content"    TEXT NOT NULL,
    "embedding"  vector(768),
    "metadata"   jsonb NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_message" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "role"       TEXT NOT NULL,
    "content"    TEXT NOT NULL,
    "sources"    JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_message_user_id_created_at_idx" ON "chat_message"("user_id", "created_at");

ALTER TABLE "chat_message"
    ADD CONSTRAINT "chat_message_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_chunk"
    ADD COLUMN fts_vector tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

CREATE INDEX "knowledge_chunk_fts_idx" ON "knowledge_chunk" USING GIN (fts_vector);

CREATE INDEX "knowledge_chunk_embedding_hnsw_idx"
    ON "knowledge_chunk" USING hnsw (embedding vector_cosine_ops);
