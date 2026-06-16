/*
  Warnings:

  - You are about to drop the `idea_conference` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ConferenceStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "conference_invite" DROP CONSTRAINT "conference_invite_conference_id_fkey";

-- DropForeignKey
ALTER TABLE "idea_conference" DROP CONSTRAINT "idea_conference_idea_id_fkey";

-- DropForeignKey
ALTER TABLE "idea_conference" DROP CONSTRAINT "idea_conference_scheduled_by_id_fkey";

-- DropTable
DROP TABLE "idea_conference";

-- DropEnum
DROP TYPE "IdeaConferenceStatus";

-- CreateTable
CREATE TABLE "conference" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT,
    "problem_id" TEXT,
    "scheduled_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ConferenceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "provider_room_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conference_idea_id_status_idx" ON "conference"("idea_id", "status");

-- CreateIndex
CREATE INDEX "conference_problem_id_status_idx" ON "conference"("problem_id", "status");

-- CreateIndex
CREATE INDEX "conference_idea_id_scheduled_for_idx" ON "conference"("idea_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "conference_problem_id_scheduled_for_idx" ON "conference"("problem_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "conference_scheduled_by_id_idx" ON "conference"("scheduled_by_id");

-- AddForeignKey
ALTER TABLE "conference" ADD CONSTRAINT "conference_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference" ADD CONSTRAINT "conference_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference" ADD CONSTRAINT "conference_scheduled_by_id_fkey" FOREIGN KEY ("scheduled_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_invite" ADD CONSTRAINT "conference_invite_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add XOR constraint to ensure conference belongs to EITHER an idea OR a problem, never both or neither
ALTER TABLE "conference" ADD CONSTRAINT "conference_entity_xor"
  CHECK ((("idea_id" IS NOT NULL)::int + ("problem_id" IS NOT NULL)::int) = 1);