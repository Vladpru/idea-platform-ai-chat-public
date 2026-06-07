ALTER TYPE "SummaryStatus" ADD VALUE 'SKIPPED';

ALTER TABLE "idea" ALTER COLUMN "summary_status" SET DEFAULT 'SKIPPED';
ALTER TABLE "problem" ALTER COLUMN "summary_status" SET DEFAULT 'SKIPPED';

UPDATE "idea" SET "summary_status" = 'SKIPPED' WHERE "status" = 'DRAFT' AND "summary_status" = 'PENDING';
UPDATE "problem" SET "summary_status" = 'SKIPPED' WHERE "status" = 'DRAFT' AND "summary_status" = 'PENDING';
