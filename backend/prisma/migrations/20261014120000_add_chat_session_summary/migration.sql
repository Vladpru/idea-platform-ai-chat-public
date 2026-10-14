ALTER TABLE "chat_session" ADD COLUMN "summary" TEXT,
ADD COLUMN "summary_message_count" INTEGER NOT NULL DEFAULT 0;
