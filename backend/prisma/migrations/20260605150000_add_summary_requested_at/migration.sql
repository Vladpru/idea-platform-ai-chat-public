ALTER TABLE "idea"
ADD COLUMN "summary_requested_at" TIMESTAMP(3);

ALTER TABLE "problem"
ADD COLUMN "summary_requested_at" TIMESTAMP(3);

UPDATE "idea"
SET "summary_requested_at" = "updated_at"
WHERE "summary_status" = 'PENDING'
  AND "summary_requested_at" IS NULL;

UPDATE "problem"
SET "summary_requested_at" = "updated_at"
WHERE "summary_status" = 'PENDING'
  AND "summary_requested_at" IS NULL;
