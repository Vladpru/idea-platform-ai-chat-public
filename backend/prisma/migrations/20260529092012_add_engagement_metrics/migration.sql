ALTER TABLE "problem" ADD COLUMN "comment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "idea_view" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idea_view_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "idea_like" (
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idea_like_pkey" PRIMARY KEY ("idea_id","user_id")
);

CREATE TABLE "problem_view" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "problem_view_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "problem_like" (
    "problem_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "problem_like_pkey" PRIMARY KEY ("problem_id","user_id")
);

CREATE INDEX "idea_view_idea_id_idx" ON "idea_view"("idea_id");
CREATE INDEX "idea_view_user_id_idx" ON "idea_view"("user_id");
CREATE UNIQUE INDEX "idea_view_idea_id_user_id_key" ON "idea_view"("idea_id", "user_id");

CREATE INDEX "idea_like_user_id_idx" ON "idea_like"("user_id");

CREATE INDEX "problem_view_problem_id_idx" ON "problem_view"("problem_id");
CREATE INDEX "problem_view_user_id_idx" ON "problem_view"("user_id");
CREATE UNIQUE INDEX "problem_view_problem_id_user_id_key" ON "problem_view"("problem_id", "user_id");

CREATE INDEX "problem_like_user_id_idx" ON "problem_like"("user_id");

ALTER TABLE "idea_view" ADD CONSTRAINT "idea_view_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "idea_view" ADD CONSTRAINT "idea_view_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "idea_like" ADD CONSTRAINT "idea_like_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "idea_like" ADD CONSTRAINT "idea_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "problem_view" ADD CONSTRAINT "problem_view_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "problem_view" ADD CONSTRAINT "problem_view_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "problem_like" ADD CONSTRAINT "problem_like_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "problem_like" ADD CONSTRAINT "problem_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;