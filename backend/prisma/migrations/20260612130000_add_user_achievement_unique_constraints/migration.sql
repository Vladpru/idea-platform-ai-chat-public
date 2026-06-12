CREATE UNIQUE INDEX "user_achievement_user_id_achievement_id_unique"
  ON "user_achievement"("user_id", "achievement_id")
  WHERE "metadata" IS NULL;

CREATE UNIQUE INDEX "user_achievement_user_id_achievement_id_month_unique"
  ON "user_achievement"("user_id", "achievement_id", (("metadata" ->> 'month')))
  WHERE "metadata" IS NOT NULL;
