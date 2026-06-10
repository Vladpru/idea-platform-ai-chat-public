-- CreateTable
CREATE TABLE "live_chat_room" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT,
    "problem_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_chat_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_chat_message" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_chat_room_idea_id_key" ON "live_chat_room"("idea_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_chat_room_problem_id_key" ON "live_chat_room"("problem_id");

-- CreateIndex
CREATE INDEX "live_chat_message_room_id_created_at_idx" ON "live_chat_message"("room_id", "created_at");

-- AddForeignKey
ALTER TABLE "live_chat_room" ADD CONSTRAINT "live_chat_room_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_room" ADD CONSTRAINT "live_chat_room_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_room" ADD CONSTRAINT "live_chat_room_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_message" ADD CONSTRAINT "live_chat_message_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "live_chat_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_message" ADD CONSTRAINT "live_chat_message_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
