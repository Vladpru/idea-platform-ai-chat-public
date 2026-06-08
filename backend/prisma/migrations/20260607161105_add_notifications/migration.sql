ALTER TABLE "user" ADD COLUMN "notification_preferences" JSONB NOT NULL DEFAULT '{"newSimilarIdeas": {"inApp": true, "email": true}, "newSimilarProblems": {"inApp": true, "email": true}, "statusChange": {"inApp": true, "email": true}, "newSupporters": {"inApp": true, "email": true}, "newComments": {"inApp": true, "email": true}, "followUps": {"inApp": true, "email": true}, "assignedIdeasAndProblems": {"inApp": false, "email": false}}';

CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_user_id_read_at_idx" ON "notification"("user_id", "read_at");

CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at");

ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
