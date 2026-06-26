-- Truncate existing test data so the NOT NULL session_id column can be added
TRUNCATE TABLE "chat_message";

-- CreateTable
CREATE TABLE "chat_session" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add session_id column to chat_message
ALTER TABLE "chat_message" ADD COLUMN "session_id" TEXT NOT NULL;

-- DropIndex on old index
DROP INDEX IF EXISTS "chat_message_userId_createdAt_idx";
DROP INDEX IF EXISTS "chat_message_user_id_created_at_idx";

-- CreateIndex
CREATE INDEX "chat_session_user_id_updated_at_idx" ON "chat_session"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_message_session_id_created_at_idx" ON "chat_message"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
