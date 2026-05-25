/*
  Warnings:

  - The values [active] on the enum `Stage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Stage_new" AS ENUM ('ideation', 'prototyping', 'completed', 'archived', 'paused');
ALTER TABLE "idea" ALTER COLUMN "stage" TYPE "Stage_new" USING ("stage"::text::"Stage_new");
ALTER TYPE "Stage" RENAME TO "Stage_old";
ALTER TYPE "Stage_new" RENAME TO "Stage";
DROP TYPE "public"."Stage_old";
COMMIT;
