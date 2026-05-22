-- CreateEnum
CREATE TYPE "ProblemStage" AS ENUM ('active', 'completed', 'archived');

-- Migrate problem.stage from Stage to ProblemStage
ALTER TABLE "problem" ADD COLUMN "stage_new" "ProblemStage";

UPDATE "problem" SET "stage_new" = CASE
  WHEN "stage"::text = 'completed' THEN 'completed'::"ProblemStage"
  WHEN "stage"::text = 'archived' THEN 'archived'::"ProblemStage"
  ELSE 'active'::"ProblemStage"
END
WHERE "stage" IS NOT NULL;
-- rows with stage IS NULL keep stage_new NULL

ALTER TABLE "problem" DROP COLUMN "stage";
ALTER TABLE "problem" RENAME COLUMN "stage_new" TO "stage";
