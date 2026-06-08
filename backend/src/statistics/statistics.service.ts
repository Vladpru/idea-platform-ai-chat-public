import { BadRequestException, Injectable } from '@nestjs/common';

import {
  IdeaStatus,
  Prisma,
  ProblemStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SCORING_WEIGHTS } from '../shared/types/scoring.types';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  StatisticsBucketGranularity,
  StatisticsChartSeries,
  StatisticsContributor,
  StatisticsDataPoint,
  StatisticsPeriod,
  StatisticsSnapshotResponse,
} from '../shared/types/statistics.types';
import { formatChartBucketLabel } from './lib/statistics-chart-label.util';
import {
  buildChartPanel,
  sumSeriesPoints,
} from './lib/statistics-chart-panel.util';
import { resolveStatisticsPeriodRange } from './lib/statistics-period.util';

type BucketCountRow = { bucket: Date; count: bigint };
type EarliestDateRow = { earliest: Date | null };
type LeaderboardScoreRow = {
  user_id: string;
  total: bigint;
  ideas: bigint;
  updates: bigint;
  joined_projects: bigint;
  comments: bigint;
  views: bigint;
  likes: bigint;
};

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(
    period: StatisticsPeriod,
    timeZoneRaw?: string,
  ): Promise<StatisticsSnapshotResponse> {
    const timeZone = this.resolveTimeZone(timeZoneRaw);
    const allTimeStart =
      period === 'all_time' ? await this.getEarliestPublishedAt() : undefined;
    const range = resolveStatisticsPeriodRange(
      period,
      timeZone,
      new Date(),
      allTimeStart ?? undefined,
    );
    const granularity = this.resolveBucketGranularity(
      period,
      range.start,
      range.end,
    );
    const {
      ideasSeries,
      problemsSeries,
      newUsersSeries,
      activeUsersSeries,
      updatesSeries,
      commentsSeries,
      viewsSeries,
      likesSeries,
    } = await this.fetchChartSeries(
      granularity,
      range.start,
      range.end,
      timeZone,
    );

    const newIdeasTotal = sumSeriesPoints(ideasSeries.points);
    const newProblemsTotal = sumSeriesPoints(problemsSeries.points);
    const newUsersTotal = sumSeriesPoints(newUsersSeries.points);
    const activeUsersTotal = await this.countActiveUsers(
      range.start,
      range.end,
    );
    const updatesTotal = sumSeriesPoints(updatesSeries.points);
    const commentsTotal = sumSeriesPoints(commentsSeries.points);
    const [topContributors, costBenefitTotal] = await Promise.all([
      this.getTopContributors(range.start, range.end),
      this.getCostBenefitTotal(range.start, range.end),
    ]);

    return {
      charts: {
        newEntities: buildChartPanel([ideasSeries, problemsSeries]),
        users: buildChartPanel([activeUsersSeries, newUsersSeries]),
        activity: buildChartPanel([
          updatesSeries,
          commentsSeries,
          viewsSeries,
          likesSeries,
        ]),
      },
      users: [
        { label: 'New Users', value: newUsersTotal },
        { label: 'Active Users', value: activeUsersTotal },
      ],
      activity: [
        { label: 'New Ideas', value: newIdeasTotal },
        { label: 'New Problems', value: newProblemsTotal },
        { label: 'Updates', value: updatesTotal },
        { label: 'Comments', value: commentsTotal },
      ],
      topContributors,
      costBenefitTotal,
    };
  }

  async getLeaderboard(
    period: StatisticsPeriod,
    timeZoneRaw?: string,
  ): Promise<LeaderboardResponse> {
    const timeZone = this.resolveTimeZone(timeZoneRaw);
    const allTimeStart =
      period === 'all_time' ? await this.getEarliestPublishedAt() : undefined;
    const range = resolveStatisticsPeriodRange(
      period,
      timeZone,
      new Date(),
      allTimeStart ?? undefined,
    );

    const entries = await this.queryLeaderboardEntries(range.start, range.end);

    return { entries };
  }

  private scoringPoints(weight: number): Prisma.Sql {
    return Prisma.raw(String(weight));
  }

  private async queryLeaderboardEntries(
    start: Date,
    end: Date,
    limit?: number,
  ): Promise<LeaderboardEntry[]> {
    const weights = DEFAULT_SCORING_WEIGHTS;
    const limitSql =
      typeof limit === 'number' ? Prisma.sql`LIMIT ${limit}` : Prisma.empty;

    const ranked = await this.prisma.$queryRaw<LeaderboardScoreRow[]>`
      WITH activity AS (
        SELECT "author_id" AS user_id, 'ideas'::text AS category, ${this.scoringPoints(weights.CREATE_IDEA)} AS points
        FROM "idea"
        WHERE "status" = ${IdeaStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND ${this.asUtcTimestamptz('published_at')} >= ${start}
          AND ${this.asUtcTimestamptz('published_at')} <= ${end}

        UNION ALL

        SELECT "author_id", 'updates'::text, ${this.scoringPoints(weights.CREATE_IDEA_UPDATE)}
        FROM "idea"
        WHERE "status" = ${IdeaStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND "updated_at" > "published_at"
          AND ${this.asUtcTimestamptz('updated_at')} >= ${start}
          AND ${this.asUtcTimestamptz('updated_at')} <= ${end}

        UNION ALL

        SELECT "author_id", 'comments'::text, ${this.scoringPoints(weights.CREATE_IDEA_COMMENT)}
        FROM "comment"
        WHERE "idea_id" IS NOT NULL
          AND ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}

        UNION ALL

        SELECT "user_id", 'joinedProjects'::text, ${this.scoringPoints(weights.JOIN_IDEA)}
        FROM "idea_member"
        WHERE ${this.asUtcTimestamptz('joined_at')} >= ${start}
          AND ${this.asUtcTimestamptz('joined_at')} <= ${end}

        UNION ALL

        SELECT "user_id", 'views'::text, ${this.scoringPoints(weights.VIEW_IDEA)}
        FROM "idea_view"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}

        UNION ALL

        SELECT "user_id", 'likes'::text, ${this.scoringPoints(weights.LIKE_IDEA)}
        FROM "idea_like"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
      )
      SELECT
        user_id,
        SUM(points)::bigint AS total,
        COALESCE(SUM(points) FILTER (WHERE category = 'ideas'), 0)::bigint AS ideas,
        COALESCE(SUM(points) FILTER (WHERE category = 'updates'), 0)::bigint AS updates,
        COALESCE(SUM(points) FILTER (WHERE category = 'joinedProjects'), 0)::bigint AS joined_projects,
        COALESCE(SUM(points) FILTER (WHERE category = 'comments'), 0)::bigint AS comments,
        COALESCE(SUM(points) FILTER (WHERE category = 'views'), 0)::bigint AS views,
        COALESCE(SUM(points) FILTER (WHERE category = 'likes'), 0)::bigint AS likes
      FROM activity
      GROUP BY user_id
      HAVING SUM(points) > 0
      ORDER BY total DESC
      ${limitSql}
    `;

    if (ranked.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ranked.map(row => row.user_id) } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    const usersById = new Map(users.map(user => [user.id, user]));

    return ranked.map(row => {
      const user = usersById.get(row.user_id);

      return {
        id: row.user_id,
        name: this.formatContributorName(user),
        points: Number(row.total),
        avatarUrl: user?.avatarUrl ?? null,
        breakdown: {
          ideas: Number(row.ideas),
          updates: Number(row.updates),
          joinedProjects: Number(row.joined_projects),
          comments: Number(row.comments),
          views: Number(row.views),
          likes: Number(row.likes),
        },
      };
    });
  }

  private async getTopContributors(
    start: Date,
    end: Date,
  ): Promise<StatisticsContributor[]> {
    const entries = await this.queryLeaderboardEntries(start, end, 5);

    return entries.map(({ id, name, points, avatarUrl }) => ({
      id,
      name,
      points,
      avatarUrl,
    }));
  }

  private async getCostBenefitTotal(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: unknown }>>`
      SELECT COALESCE(SUM("cost_benefit"), 0) AS total
      FROM "problem"
      WHERE "status" = ${ProblemStatus.PUBLISHED}
        AND "cost_benefit" IS NOT NULL
        AND "published_at" IS NOT NULL
        AND ${this.asUtcTimestamptz('published_at')} >= ${start}
        AND ${this.asUtcTimestamptz('published_at')} <= ${end}
    `;

    return Number(rows[0]?.total ?? 0);
  }

  private formatContributorName(
    user:
      | {
          email: string;
          firstName: string | null;
          lastName: string | null;
        }
      | undefined,
  ): string {
    if (!user) {
      return 'Unknown User';
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    return fullName || user.email;
  }

  private resolveBucketGranularity(
    period: StatisticsPeriod,
    start: Date,
    end: Date,
  ): StatisticsBucketGranularity {
    if (period === 'day') {
      return 'hour';
    }

    if (period === 'year' || period === 'all_time') {
      return 'month';
    }

    const daySpan = (end.getTime() - start.getTime()) / 86_400_000;
    return daySpan > 90 ? 'month' : 'day';
  }

  private async fetchChartSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<{
    ideasSeries: StatisticsChartSeries;
    problemsSeries: StatisticsChartSeries;
    newUsersSeries: StatisticsChartSeries;
    activeUsersSeries: StatisticsChartSeries;
    updatesSeries: StatisticsChartSeries;
    commentsSeries: StatisticsChartSeries;
    viewsSeries: StatisticsChartSeries;
    likesSeries: StatisticsChartSeries;
  }> {
    const [
      ideasSeries,
      problemsSeries,
      newUsersSeries,
      activeUsersSeries,
      updatesSeries,
      commentsSeries,
      viewsSeries,
      likesSeries,
    ] = await Promise.all([
      this.getPublishedEntitySeries('idea', granularity, start, end, timeZone),
      this.getPublishedEntitySeries(
        'problem',
        granularity,
        start,
        end,
        timeZone,
      ),
      this.getNewUsersSeries(granularity, start, end, timeZone),
      this.getActiveUsersSeries(granularity, start, end, timeZone),
      this.getUpdatesSeries(granularity, start, end, timeZone),
      this.getCommentsSeries(granularity, start, end, timeZone),
      this.getViewsSeries(granularity, start, end, timeZone),
      this.getLikesSeries(granularity, start, end, timeZone),
    ]);

    return {
      ideasSeries,
      problemsSeries,
      newUsersSeries,
      activeUsersSeries,
      updatesSeries,
      commentsSeries,
      viewsSeries,
      likesSeries,
    };
  }

  private async getEarliestPublishedAt(): Promise<Date | null> {
    const rows = await this.prisma.$queryRaw<EarliestDateRow[]>`
      SELECT MIN(published_at) AS earliest
      FROM (
        SELECT "published_at"
        FROM "idea"
        WHERE "published_at" IS NOT NULL
        UNION ALL
        SELECT "published_at"
        FROM "problem"
        WHERE "published_at" IS NOT NULL
      ) AS published_entities
    `;

    return rows[0]?.earliest ?? null;
  }

  private async getPublishedEntitySeries(
    entityType: 'idea' | 'problem',
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const table = Prisma.raw(`"${entityType}"`);
    const publishedStatus =
      entityType === 'idea' ? IdeaStatus.PUBLISHED : ProblemStatus.PUBLISHED;
    const key = entityType === 'idea' ? 'ideas' : 'problems';
    const label = entityType === 'idea' ? 'Ideas' : 'Problems';

    const rows = await this.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "published_at" AS event_at
        FROM ${table}
        WHERE "status" = ${publishedStatus}
          AND "published_at" IS NOT NULL
          AND ${this.asUtcTimestamptz('published_at')} >= ${start}
          AND ${this.asUtcTimestamptz('published_at')} <= ${end}
      `,
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return { key, label, total: sumSeriesPoints(points), points };
  }

  private async getNewUsersSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const rows = await this.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "user"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
      `,
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return {
      key: 'newUsers',
      label: 'New users',
      total: sumSeriesPoints(points),
      points,
    };
  }

  private async getActiveUsersSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const rows = await this.queryDistinctBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "author_id" AS user_id, "published_at" AS event_at
        FROM "idea"
        WHERE ${this.asUtcTimestamptz('published_at')} >= ${start}
          AND ${this.asUtcTimestamptz('published_at')} <= ${end}
        UNION ALL
        SELECT "author_id" AS user_id, "updated_at" AS event_at
        FROM "idea"
        WHERE ${this.asUtcTimestamptz('updated_at')} >= ${start}
          AND ${this.asUtcTimestamptz('updated_at')} <= ${end}
        UNION ALL
        SELECT "author_id" AS user_id, "published_at" AS event_at
        FROM "problem"
        WHERE ${this.asUtcTimestamptz('published_at')} >= ${start}
          AND ${this.asUtcTimestamptz('published_at')} <= ${end}
        UNION ALL
        SELECT "author_id" AS user_id, "updated_at" AS event_at
        FROM "problem"
        WHERE ${this.asUtcTimestamptz('updated_at')} >= ${start}
          AND ${this.asUtcTimestamptz('updated_at')} <= ${end}
      `,
      eventColumn: 'event_at',
      userColumn: 'user_id',
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return {
      key: 'activeUsers',
      label: 'Active users',
      total: await this.countActiveUsers(start, end),
      points,
    };
  }

  private async getUpdatesSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const rows = await this.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "updated_at" AS event_at
        FROM "idea"
        WHERE "status" = ${IdeaStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND ${this.asUtcTimestamptz('updated_at')} >= ${start}
          AND ${this.asUtcTimestamptz('updated_at')} <= ${end}
          AND "updated_at" > "published_at"
        UNION ALL
        SELECT "updated_at" AS event_at
        FROM "problem"
        WHERE "status" = ${ProblemStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND ${this.asUtcTimestamptz('updated_at')} >= ${start}
          AND ${this.asUtcTimestamptz('updated_at')} <= ${end}
          AND "updated_at" > "published_at"
      `,
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return {
      key: 'updates',
      label: 'Updates',
      total: sumSeriesPoints(points),
      points,
    };
  }

  private async getCommentsSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const rows = await this.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "comment"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
      `,
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return {
      key: 'comments',
      label: 'Comments',
      total: sumSeriesPoints(points),
      points,
    };
  }

  private async getViewsSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const rows = await this.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "idea_view"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
        UNION ALL
        SELECT "created_at" AS event_at
        FROM "problem_view"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
      `,
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return {
      key: 'views',
      label: 'Views',
      total: sumSeriesPoints(points),
      points,
    };
  }

  private async getLikesSeries(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsChartSeries> {
    const rows = await this.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "idea_like"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
        UNION ALL
        SELECT "created_at" AS event_at
        FROM "problem_like"
        WHERE ${this.asUtcTimestamptz('created_at')} >= ${start}
          AND ${this.asUtcTimestamptz('created_at')} <= ${end}
      `,
    });

    const points = this.mapBucketRows(rows, granularity, timeZone);
    return {
      key: 'likes',
      label: 'Likes',
      total: sumSeriesPoints(points),
      points,
    };
  }

  private async queryBucketedCounts(params: {
    granularity: StatisticsBucketGranularity;
    start: Date;
    end: Date;
    timeZone: string;
    sourceSql: Prisma.Sql;
  }): Promise<BucketCountRow[]> {
    const bucketExpr = this.getBucketExpression(
      params.granularity,
      params.timeZone,
      'event_at',
    );
    const bucketSeries = this.getBucketSeriesExpression(
      params.granularity,
      params.start,
      params.end,
      params.timeZone,
    );

    return this.prisma.$queryRaw<BucketCountRow[]>`
      WITH buckets AS (
        SELECT ${bucketSeries} AS bucket
      ),
      counts AS (
        SELECT
          ${bucketExpr} AS bucket,
          COUNT(*)::bigint AS count
        FROM (${params.sourceSql}) AS events
        GROUP BY 1
      )
      SELECT buckets.bucket, COALESCE(counts.count, 0)::bigint AS count
      FROM buckets
      LEFT JOIN counts ON counts.bucket = buckets.bucket
      ORDER BY buckets.bucket ASC
    `;
  }

  private async queryDistinctBucketedCounts(params: {
    granularity: StatisticsBucketGranularity;
    start: Date;
    end: Date;
    timeZone: string;
    sourceSql: Prisma.Sql;
    eventColumn: string;
    userColumn: string;
  }): Promise<BucketCountRow[]> {
    const bucketExpr = this.getBucketExpression(
      params.granularity,
      params.timeZone,
      params.eventColumn,
    );
    const bucketSeries = this.getBucketSeriesExpression(
      params.granularity,
      params.start,
      params.end,
      params.timeZone,
    );

    return this.prisma.$queryRaw<BucketCountRow[]>`
      WITH buckets AS (
        SELECT ${bucketSeries} AS bucket
      ),
      counts AS (
        SELECT
          ${bucketExpr} AS bucket,
          COUNT(DISTINCT ${Prisma.raw(`"${params.userColumn}"`)})::bigint AS count
        FROM (${params.sourceSql}) AS events
        GROUP BY 1
      )
      SELECT buckets.bucket, COALESCE(counts.count, 0)::bigint AS count
      FROM buckets
      LEFT JOIN counts ON counts.bucket = buckets.bucket
      ORDER BY buckets.bucket ASC
    `;
  }

  private asUtcTimestamptz(column: string): Prisma.Sql {
    const columnRef = Prisma.raw(`"${column}"`);
    return Prisma.sql`(${columnRef} AT TIME ZONE 'UTC')`;
  }

  private toZonedWallClock(column: string, timeZone: string): Prisma.Sql {
    return Prisma.sql`${this.asUtcTimestamptz(column)} AT TIME ZONE ${timeZone}`;
  }

  private getBucketExpression(
    granularity: StatisticsBucketGranularity,
    timeZone: string,
    column: string,
  ): Prisma.Sql {
    const zonedColumn = this.toZonedWallClock(column, timeZone);

    if (granularity === 'hour') {
      return Prisma.sql`DATE_TRUNC('hour', ${zonedColumn})`;
    }

    if (granularity === 'month') {
      return Prisma.sql`DATE_TRUNC('month', ${zonedColumn})::date`;
    }

    return Prisma.sql`(${zonedColumn})::date`;
  }

  private getBucketSeriesExpression(
    granularity: StatisticsBucketGranularity,
    start: Date,
    end: Date,
    timeZone: string,
  ): Prisma.Sql {
    if (granularity === 'hour') {
      return Prisma.sql`generate_series(
        DATE_TRUNC('hour', ${start} AT TIME ZONE ${timeZone}),
        DATE_TRUNC('hour', ${end} AT TIME ZONE ${timeZone}),
        INTERVAL '1 hour'
      )`;
    }

    if (granularity === 'month') {
      return Prisma.sql`generate_series(
        DATE_TRUNC('month', ${start} AT TIME ZONE ${timeZone})::date,
        DATE_TRUNC('month', ${end} AT TIME ZONE ${timeZone})::date,
        INTERVAL '1 month'
      )::date`;
    }

    return Prisma.sql`generate_series(
      (${start} AT TIME ZONE ${timeZone})::date,
      (${end} AT TIME ZONE ${timeZone})::date,
      INTERVAL '1 day'
    )::date`;
  }

  private mapBucketRows(
    rows: BucketCountRow[],
    granularity: StatisticsBucketGranularity,
    timeZone: string,
  ): StatisticsDataPoint[] {
    const labelStyle = this.resolveChartLabelStyle(granularity, rows.length);

    return rows.map(row => ({
      label: formatChartBucketLabel(row.bucket, timeZone, labelStyle),
      value: Number(row.count),
    }));
  }

  private resolveChartLabelStyle(
    granularity: StatisticsBucketGranularity,
    bucketCount: number,
  ): 'hour' | 'weekday' | 'shortDate' | 'month' {
    if (granularity === 'hour') {
      return 'hour';
    }

    if (granularity === 'month') {
      return 'month';
    }

    return bucketCount <= 7 ? 'weekday' : 'shortDate';
  }

  private resolveTimeZone(timeZoneRaw?: string): string {
    const timeZone = timeZoneRaw?.trim() || 'UTC';
    try {
      Intl.DateTimeFormat('en-US', { timeZone });
      return timeZone;
    } catch {
      throw new BadRequestException('Invalid IANA timezone');
    }
  }

  private async countActiveUsers(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT "author_id" AS user_id
        FROM "idea"
        WHERE (
          (${this.asUtcTimestamptz('published_at')} >= ${start} AND ${this.asUtcTimestamptz('published_at')} <= ${end})
          OR (${this.asUtcTimestamptz('updated_at')} >= ${start} AND ${this.asUtcTimestamptz('updated_at')} <= ${end})
        )
        UNION
        SELECT "author_id" AS user_id
        FROM "problem"
        WHERE (
          (${this.asUtcTimestamptz('published_at')} >= ${start} AND ${this.asUtcTimestamptz('published_at')} <= ${end})
          OR (${this.asUtcTimestamptz('updated_at')} >= ${start} AND ${this.asUtcTimestamptz('updated_at')} <= ${end})
        )
      ) AS active_users
    `;

    return Number(rows[0]?.count ?? 0);
  }
}
