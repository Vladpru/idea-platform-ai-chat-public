-- AlterTable
ALTER TABLE "problem" ADD COLUMN     "cost_benefit" DECIMAL(12,2),
ADD COLUMN     "stage" "Stage",
ADD COLUMN     "value_proposition" TEXT;

-- CreateTable
CREATE TABLE "problem_media" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "provider" "MediaProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "original_filename" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "problem_media_problem_id_kind_idx" ON "problem_media"("problem_id", "kind");

-- AddForeignKey
ALTER TABLE "problem_media" ADD CONSTRAINT "problem_media_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
