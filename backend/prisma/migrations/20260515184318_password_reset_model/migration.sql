/*
  Warnings:

  - You are about to drop the column `real_name` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "real_name",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;
