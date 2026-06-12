-- CreateEnum
CREATE TYPE "IdeaConferenceStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConferenceInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConferenceInviteType" AS ENUM ('PLATFORM_USER', 'EXTERNAL_EMAIL');

-- CreateTable
CREATE TABLE "idea_conference" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "scheduled_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IdeaConferenceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "provider_room_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idea_conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conference_invite" (
    "id" TEXT NOT NULL,
    "conference_id" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "invite_type" "ConferenceInviteType" NOT NULL,
    "status" "ConferenceInviteStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" TEXT,
    "email" TEXT,
    "token_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conference_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idea_conference_idea_id_status_idx" ON "idea_conference"("idea_id", "status");

-- CreateIndex
CREATE INDEX "idea_conference_idea_id_scheduled_for_idx" ON "idea_conference"("idea_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "idea_conference_scheduled_by_id_idx" ON "idea_conference"("scheduled_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "idea_conference_one_live_per_idea" ON "idea_conference"("idea_id") WHERE "status" = 'LIVE';

-- CreateIndex
CREATE INDEX "conference_invite_user_id_idx" ON "conference_invite"("user_id");

-- CreateIndex
CREATE INDEX "conference_invite_email_idx" ON "conference_invite"("email");

-- CreateIndex
CREATE INDEX "conference_invite_conference_id_status_idx" ON "conference_invite"("conference_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "conference_invite_conference_id_user_id_key" ON "conference_invite"("conference_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conference_invite_conference_id_email_key" ON "conference_invite"("conference_id", "email");

-- AddForeignKey
ALTER TABLE "idea_conference" ADD CONSTRAINT "idea_conference_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_conference" ADD CONSTRAINT "idea_conference_scheduled_by_id_fkey" FOREIGN KEY ("scheduled_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_invite" ADD CONSTRAINT "conference_invite_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "idea_conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_invite" ADD CONSTRAINT "conference_invite_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_invite" ADD CONSTRAINT "conference_invite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
