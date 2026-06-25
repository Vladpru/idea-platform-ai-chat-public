/*
  Warnings:

  - You are about to drop the column `fts_vector` on the `knowledge_chunk` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "knowledge_chunk_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "knowledge_chunk_fts_idx";

-- AlterTable
ALTER TABLE "knowledge_chunk" DROP COLUMN "fts_vector";
