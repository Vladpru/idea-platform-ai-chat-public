import { Injectable } from '@nestjs/common';

import {
  IdeaStatus,
  Prisma,
  ProblemStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  StatisticsBucketGranularity,
  StatisticsChartSeries,
  StatisticsDataPoint,
} from '../shared/types/statistics.types';
import {
  formatChartBucketLabel,
  resolveChartLabelStyle,
} from './lib/chart/chart-label.util';
import { sumSeriesPoints } from './lib/chart/chart-panel.util';
import type { BucketCountRow, EarliestDateRow } from './lib/query/query.types';
import { asUtcTimestamptz } from './lib/query/timestamp-sql.util';
import { StatisticsBucketRepository } from './statistics-bucket.repository';

@Injectable()
export class StatisticsChartsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buckets: StatisticsBucketRepository,
  ) {}

  async fetchChartSeries(
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

  async getEarliestPublishedAt(): Promise<Date | null> {
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

  async getCostBenefitTotal(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: unknown }>>`
      SELECT COALESCE(SUM("cost_benefit"), 0) AS total
      FROM "problem"
      WHERE "status" = ${ProblemStatus.PUBLISHED}
        AND "cost_benefit" IS NOT NULL
        AND "published_at" IS NOT NULL
        AND ${asUtcTimestamptz('published_at')} >= ${start}
        AND ${asUtcTimestamptz('published_at')} <= ${end}
    `;

    return Number(rows[0]?.total ?? 0);
  }

  async countActiveUsers(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT "author_id" AS user_id
        FROM "idea"
        WHERE (
          (${asUtcTimestamptz('published_at')} >= ${start} AND ${asUtcTimestamptz('published_at')} <= ${end})
          OR (${asUtcTimestamptz('updated_at')} >= ${start} AND ${asUtcTimestamptz('updated_at')} <= ${end})
        )
        UNION
        SELECT "author_id" AS user_id
        FROM "problem"
        WHERE (
          (${asUtcTimestamptz('published_at')} >= ${start} AND ${asUtcTimestamptz('published_at')} <= ${end})
          OR (${asUtcTimestamptz('updated_at')} >= ${start} AND ${asUtcTimestamptz('updated_at')} <= ${end})
        )
      ) AS active_users
    `;

    return Number(rows[0]?.count ?? 0);
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

    const rows = await this.buckets.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "published_at" AS event_at
        FROM ${table}
        WHERE "status" = ${publishedStatus}
          AND "published_at" IS NOT NULL
          AND ${asUtcTimestamptz('published_at')} >= ${start}
          AND ${asUtcTimestamptz('published_at')} <= ${end}
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
    const rows = await this.buckets.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "user"
        WHERE ${asUtcTimestamptz('created_at')} >= ${start}
          AND ${asUtcTimestamptz('created_at')} <= ${end}
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
    const rows = await this.buckets.queryDistinctBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "author_id" AS user_id, "published_at" AS event_at
        FROM "idea"
        WHERE ${asUtcTimestamptz('published_at')} >= ${start}
          AND ${asUtcTimestamptz('published_at')} <= ${end}
        UNION ALL
        SELECT "author_id" AS user_id, "updated_at" AS event_at
        FROM "idea"
        WHERE ${asUtcTimestamptz('updated_at')} >= ${start}
          AND ${asUtcTimestamptz('updated_at')} <= ${end}
        UNION ALL
        SELECT "author_id" AS user_id, "published_at" AS event_at
        FROM "problem"
        WHERE ${asUtcTimestamptz('published_at')} >= ${start}
          AND ${asUtcTimestamptz('published_at')} <= ${end}
        UNION ALL
        SELECT "author_id" AS user_id, "updated_at" AS event_at
        FROM "problem"
        WHERE ${asUtcTimestamptz('updated_at')} >= ${start}
          AND ${asUtcTimestamptz('updated_at')} <= ${end}
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
    const rows = await this.buckets.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "updated_at" AS event_at
        FROM "idea"
        WHERE "status" = ${IdeaStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND ${asUtcTimestamptz('updated_at')} >= ${start}
          AND ${asUtcTimestamptz('updated_at')} <= ${end}
          AND "updated_at" > "published_at"
        UNION ALL
        SELECT "updated_at" AS event_at
        FROM "problem"
        WHERE "status" = ${ProblemStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND ${asUtcTimestamptz('updated_at')} >= ${start}
          AND ${asUtcTimestamptz('updated_at')} <= ${end}
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
    const rows = await this.buckets.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "comment"
        WHERE ${asUtcTimestamptz('created_at')} >= ${start}
          AND ${asUtcTimestamptz('created_at')} <= ${end}
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
    const rows = await this.buckets.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "idea_view"
        WHERE ${asUtcTimestamptz('created_at')} >= ${start}
          AND ${asUtcTimestamptz('created_at')} <= ${end}
        UNION ALL
        SELECT "created_at" AS event_at
        FROM "problem_view"
        WHERE ${asUtcTimestamptz('created_at')} >= ${start}
          AND ${asUtcTimestamptz('created_at')} <= ${end}
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
    const rows = await this.buckets.queryBucketedCounts({
      granularity,
      start,
      end,
      timeZone,
      sourceSql: Prisma.sql`
        SELECT "created_at" AS event_at
        FROM "idea_like"
        WHERE ${asUtcTimestamptz('created_at')} >= ${start}
          AND ${asUtcTimestamptz('created_at')} <= ${end}
        UNION ALL
        SELECT "created_at" AS event_at
        FROM "problem_like"
        WHERE ${asUtcTimestamptz('created_at')} >= ${start}
          AND ${asUtcTimestamptz('created_at')} <= ${end}
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

  private mapBucketRows(
    rows: BucketCountRow[],
    granularity: StatisticsBucketGranularity,
    timeZone: string,
  ): StatisticsDataPoint[] {
    const labelStyle = resolveChartLabelStyle(granularity, rows.length);

    return rows.map(row => ({
      label: formatChartBucketLabel(row.bucket, timeZone, labelStyle),
      value: Number(row.count),
    }));
  }
}
