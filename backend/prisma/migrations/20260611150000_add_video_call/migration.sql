-- CreateEnum
CREATE TYPE "VideoCallStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "video_call" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "status" "VideoCallStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_for" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "provider_room_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_call_room_id_status_idx" ON "video_call"("room_id", "status");

-- CreateIndex
CREATE INDEX "video_call_room_id_scheduled_for_idx" ON "video_call"("room_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "video_call_host_id_idx" ON "video_call"("host_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_call_one_active_per_room" ON "video_call"("room_id") WHERE "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "video_call" ADD CONSTRAINT "video_call_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "live_chat_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_call" ADD CONSTRAINT "video_call_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
