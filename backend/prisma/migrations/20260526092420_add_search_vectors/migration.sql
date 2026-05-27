
ALTER TABLE "idea" DROP COLUMN IF EXISTS "search_vector";
ALTER TABLE "problem" DROP COLUMN IF EXISTS "search_vector";


ALTER TABLE "idea" 
ADD COLUMN "search_vector" tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

ALTER TABLE "problem" 
ADD COLUMN "search_vector" tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;


DROP INDEX IF EXISTS "idea_search_vector_idx";
DROP INDEX IF EXISTS "problem_search_vector_idx";

CREATE INDEX "idea_search_vector_idx" ON "idea" USING GIN ("search_vector");
CREATE INDEX "problem_search_vector_idx" ON "problem" USING GIN ("search_vector");