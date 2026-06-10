-- AlterTable
ALTER TABLE "live_chat_room" ADD COLUMN "direct_pair_key" TEXT;

-- Backfill canonical pair keys for existing direct rooms (exactly two participants).
UPDATE "live_chat_room" AS room
SET "direct_pair_key" = pairs.pair_key
FROM (
  SELECT
    participant.room_id,
    MIN(participant.user_id::text) || ':' || MAX(participant.user_id::text) AS pair_key
  FROM "live_chat_participant" AS participant
  GROUP BY participant.room_id
  HAVING COUNT(*) = 2
) AS pairs
WHERE room.id = pairs.room_id
  AND room.idea_id IS NULL
  AND room.problem_id IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "live_chat_room_direct_pair_key_key" ON "live_chat_room"("direct_pair_key");
