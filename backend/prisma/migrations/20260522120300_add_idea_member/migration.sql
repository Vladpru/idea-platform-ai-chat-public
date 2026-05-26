-- CreateTable
CREATE TABLE "idea_member" (
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_member_pkey" PRIMARY KEY ("idea_id","user_id")
);

-- CreateIndex
CREATE INDEX "idea_member_user_id_idx" ON "idea_member"("user_id");

-- AddForeignKey
ALTER TABLE "idea_member" ADD CONSTRAINT "idea_member_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_member" ADD CONSTRAINT "idea_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
