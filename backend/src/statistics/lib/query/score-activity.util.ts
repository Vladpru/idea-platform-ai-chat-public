import { IdeaStatus, Prisma, Stage } from '../../../../generated/prisma/client';
import type { ScoringWeights } from '../../../shared/types/scoring.types';
import { asUtcTimestamptz, scoringPoints } from './timestamp-sql.util';

export function buildScoreActivityCte(
  start: Date,
  end: Date,
  weights: ScoringWeights,
): Prisma.Sql {
  return Prisma.sql`
    SELECT "author_id" AS user_id, 'ideas'::text AS category, ${scoringPoints(weights.CREATE_IDEA)} AS points
    FROM "idea"
    WHERE "status" = ${IdeaStatus.PUBLISHED}
      AND "published_at" IS NOT NULL
      AND ${asUtcTimestamptz('published_at')} >= ${start}
      AND ${asUtcTimestamptz('published_at')} <= ${end}

    UNION ALL

    SELECT "author_id", 'updates'::text, ${scoringPoints(weights.CREATE_IDEA_UPDATE)}
    FROM "idea"
    WHERE "status" = ${IdeaStatus.PUBLISHED}
      AND "published_at" IS NOT NULL
      AND "updated_at" > "published_at"
      AND ${asUtcTimestamptz('updated_at')} >= ${start}
      AND ${asUtcTimestamptz('updated_at')} <= ${end}

    UNION ALL

    SELECT "author_id", 'comments'::text, ${scoringPoints(weights.CREATE_IDEA_COMMENT)}
    FROM "comment"
    WHERE "idea_id" IS NOT NULL
      AND ${asUtcTimestamptz('created_at')} >= ${start}
      AND ${asUtcTimestamptz('created_at')} <= ${end}

    UNION ALL

    SELECT "user_id", 'joinedProjects'::text, ${scoringPoints(weights.JOIN_IDEA)}
    FROM "idea_member"
    WHERE ${asUtcTimestamptz('joined_at')} >= ${start}
      AND ${asUtcTimestamptz('joined_at')} <= ${end}

    UNION ALL

    SELECT "user_id", 'views'::text, ${scoringPoints(weights.VIEW_IDEA)}
    FROM "idea_view"
    WHERE ${asUtcTimestamptz('created_at')} >= ${start}
      AND ${asUtcTimestamptz('created_at')} <= ${end}

    UNION ALL

    SELECT "user_id", 'likes'::text, ${scoringPoints(weights.LIKE_IDEA)}
    FROM "idea_like"
    WHERE ${asUtcTimestamptz('created_at')} >= ${start}
      AND ${asUtcTimestamptz('created_at')} <= ${end}

    UNION ALL

    SELECT "author_id", 'completedIdeas'::text, ${scoringPoints(weights.COMPLETE_IDEA)}
    FROM "idea"
    WHERE "status" = ${IdeaStatus.PUBLISHED}
      AND "stage" = ${Stage.completed}
      AND "completed_at" IS NOT NULL
      AND ${asUtcTimestamptz('completed_at')} >= ${start}
      AND ${asUtcTimestamptz('completed_at')} <= ${end}

    UNION ALL

    SELECT "user_id", 'badges'::text, ${scoringPoints(weights.EARN_BADGE)}
    FROM "user_achievement"
    WHERE ${asUtcTimestamptz('unlocked_at')} >= ${start}
      AND ${asUtcTimestamptz('unlocked_at')} <= ${end}
  `;
}
