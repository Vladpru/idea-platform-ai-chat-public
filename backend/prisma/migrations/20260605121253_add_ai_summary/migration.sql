CREATE TYPE "SummaryStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

ALTER TABLE "idea" ADD COLUMN "ai_summary" TEXT,
ADD COLUMN "summary_status" "SummaryStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "problem" ADD COLUMN "ai_summary" TEXT,
ADD COLUMN "summary_status" "SummaryStatus" NOT NULL DEFAULT 'PENDING';
