-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('ideation', 'prototyping', 'completed', 'archived', 'paused');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('MAIN_IMAGE', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('CLOUDINARY');

-- CreateTable
CREATE TABLE "idea" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'DRAFT',
    "stage" "Stage",
    "title" TEXT,
    "description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "impact" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_problem" (
    "idea_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "idea_problem_pkey" PRIMARY KEY ("idea_id","problem_id")
);

-- CreateTable
CREATE TABLE "idea_tag" (
    "idea_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "idea_tag_pkey" PRIMARY KEY ("idea_id","tag_id")
);

-- CreateTable
CREATE TABLE "idea_media" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "provider" "MediaProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "original_filename" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idea_author_id_status_idx" ON "idea"("author_id", "status");

-- CreateIndex
CREATE INDEX "idea_status_published_at_idx" ON "idea"("status", "published_at");

-- CreateIndex
CREATE INDEX "problem_author_id_status_idx" ON "problem"("author_id", "status");

-- CreateIndex
CREATE INDEX "problem_status_idx" ON "problem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "idea_media_idea_id_kind_idx" ON "idea_media"("idea_id", "kind");

-- AddForeignKey
ALTER TABLE "idea" ADD CONSTRAINT "idea_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem" ADD CONSTRAINT "problem_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_problem" ADD CONSTRAINT "idea_problem_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_problem" ADD CONSTRAINT "idea_problem_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_tag" ADD CONSTRAINT "idea_tag_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_tag" ADD CONSTRAINT "idea_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_media" ADD CONSTRAINT "idea_media_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
