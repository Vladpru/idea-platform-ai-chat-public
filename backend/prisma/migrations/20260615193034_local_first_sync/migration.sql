-- AlterTable
ALTER TABLE "idea" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "problem" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "notification_preferences" SET DEFAULT '{}';

-- Safe Migration for LiveChatMessage (4-step rollout)
ALTER TABLE "live_chat_message" ADD COLUMN "client_message_id" TEXT;
UPDATE "live_chat_message" SET "client_message_id" = "id" WHERE "client_message_id" IS NULL;
ALTER TABLE "live_chat_message" ALTER COLUMN "client_message_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "live_chat_message_author_id_client_message_id_key" ON "live_chat_message"("author_id", "client_message_id");