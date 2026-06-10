CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_follower_id_following_id_key" ON "subscription"("follower_id", "following_id");

CREATE INDEX "subscription_following_id_idx" ON "subscription"("following_id");

ALTER TABLE "subscription" ADD CONSTRAINT "subscription_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription" ADD CONSTRAINT "subscription_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user" ADD COLUMN "bio" TEXT;
ALTER TABLE "user" ADD COLUMN "social_links" JSONB DEFAULT '[]';
