UPDATE "idea"
SET "comment_count" = COALESCE(comment_totals.total, 0)
FROM "idea" AS i
LEFT JOIN (
  SELECT "idea_id", COUNT(*)::INTEGER AS total
  FROM "comment"
  WHERE "idea_id" IS NOT NULL
  GROUP BY "idea_id"
) AS comment_totals ON i."id" = comment_totals."idea_id"
WHERE "idea"."id" = i."id";

UPDATE "problem"
SET "comment_count" = COALESCE(comment_totals.total, 0)
FROM "problem" AS p
LEFT JOIN (
  SELECT "problem_id", COUNT(*)::INTEGER AS total
  FROM "comment"
  WHERE "problem_id" IS NOT NULL
  GROUP BY "problem_id"
) AS comment_totals ON p."id" = comment_totals."problem_id"
WHERE "problem"."id" = p."id";