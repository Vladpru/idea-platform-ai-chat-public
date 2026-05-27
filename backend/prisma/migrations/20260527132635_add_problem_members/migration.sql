-- CreateTable
CREATE TABLE "problem_member" (
    "problem_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_member_pkey" PRIMARY KEY ("problem_id","user_id")
);

-- CreateIndex
CREATE INDEX "problem_member_user_id_idx" ON "problem_member"("user_id");

-- AddForeignKey
ALTER TABLE "problem_member" ADD CONSTRAINT "problem_member_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_member" ADD CONSTRAINT "problem_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;