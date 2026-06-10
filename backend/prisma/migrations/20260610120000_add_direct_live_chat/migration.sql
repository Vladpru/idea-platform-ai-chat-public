-- CreateTable
CREATE TABLE "live_chat_participant" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_chat_participant_user_id_idx" ON "live_chat_participant"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_chat_participant_room_id_user_id_key" ON "live_chat_participant"("room_id", "user_id");

-- AddForeignKey
ALTER TABLE "live_chat_participant" ADD CONSTRAINT "live_chat_participant_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "live_chat_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_participant" ADD CONSTRAINT "live_chat_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
