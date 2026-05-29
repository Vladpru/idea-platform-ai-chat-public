import { BadRequestException, Injectable } from '@nestjs/common';

import { IdeaStatus, Stage } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  StatisticsContributor,
  StatisticsDataPoint,
  StatisticsPeriod,
  StatisticsSnapshotResponse,
  StatisticsStatusChange,
} from '../shared/types/statistics.types';
import { formatChartBucketLabel } from './lib/statistics-chart-label.util';
import { resolveStatisticsPeriodRange } from './lib/statistics-period.util';

const STAGE_ORDER: Stage[] = [
  Stage.ideation,
  Stage.prototyping,
  Stage.completed,
  Stage.paused,
  Stage.archived,
];

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.ideation]: 'Ideation',
  [Stage.prototyping]: 'Prototyping',
  [Stage.completed]: 'Completed',
  [Stage.paused]: 'Paused',
  [Stage.archived]: 'Archived',
};

const PUBLISHED_IDEA_WHERE = {
  status: IdeaStatus.PUBLISHED,
  publishedAt: { not: null },
} as const;

type DayCountRow = { day: Date; count: bigint };
type MonthCountRow = { month: Date; count: bigint };
type CountRow = { count: bigint };
type ContributorScoreRow = { author_id: string; score: bigint };

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(
    period: StatisticsPeriod,
    timeZoneRaw?: string,
  ): Promise<StatisticsSnapshotResponse> {
    const timeZone = this.resolveTimeZone(timeZoneRaw);
    const range = resolveStatisticsPeriodRange(period, timeZone);

    const [
      newIdeasSeries,
      statusChanges,
      newUsers,
      activeUsers,
      ideaUpdates,
      topContributors,
    ] = await Promise.all([
      this.getNewIdeasSeries(period, range.start, range.end, timeZone),
      this.getStageDistribution(),
      this.countNewUsers(range.start, range.end),
      this.countActiveUsers(range.start, range.end),
      this.countIdeaUpdates(range.start, range.end),
      this.getTopContributors(),
    ]);

    const newIdeasTotal = newIdeasSeries.reduce(
      (sum, point) => sum + point.value,
      0,
    );

    return {
      newIdeasTotal,
      newIdeasSeries,
      statusChanges,
      users: [
        { label: 'New Users', value: newUsers },
        { label: 'Active Users', value: activeUsers },
      ],
      activity: [
        { label: 'New Ideas', value: newIdeasTotal },
        { label: 'Updates', value: ideaUpdates },
      ],
      topContributors,
    };
  }

  private async getNewIdeasSeries(
    period: StatisticsPeriod,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsDataPoint[]> {
    if (period === 'year') {
      return this.getNewIdeasMonthlySeries(start, end, timeZone);
    }

    return this.getNewIdeasDailySeries(period, start, end, timeZone);
  }

  private async getNewIdeasDailySeries(
    period: StatisticsPeriod,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsDataPoint[]> {
    const rows = await this.prisma.$queryRaw<DayCountRow[]>`
      WITH buckets AS (
        SELECT generate_series(
          (${start} AT TIME ZONE ${timeZone})::date,
          (${end} AT TIME ZONE ${timeZone})::date,
          INTERVAL '1 day'
        )::date AS day
      ),
      counts AS (
        SELECT
          (published_at AT TIME ZONE ${timeZone})::date AS day,
          COUNT(*)::bigint AS count
        FROM "idea"
        WHERE "status" = ${IdeaStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND "published_at" >= ${start}
          AND "published_at" <= ${end}
        GROUP BY 1
      )
      SELECT buckets.day, COALESCE(counts.count, 0)::bigint AS count
      FROM buckets
      LEFT JOIN counts ON counts.day = buckets.day
      ORDER BY buckets.day ASC
    `;

    return rows.map(row => ({
      label: formatChartBucketLabel(
        row.day,
        timeZone,
        period === 'week' ? 'weekday' : 'shortDate',
      ),
      value: Number(row.count),
    }));
  }

  private async getNewIdeasMonthlySeries(
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<StatisticsDataPoint[]> {
    const rows = await this.prisma.$queryRaw<MonthCountRow[]>`
      WITH buckets AS (
        SELECT generate_series(
          DATE_TRUNC('month', ${start} AT TIME ZONE ${timeZone})::date,
          DATE_TRUNC('month', ${end} AT TIME ZONE ${timeZone})::date,
          INTERVAL '1 month'
        )::date AS month
      ),
      counts AS (
        SELECT
          DATE_TRUNC('month', published_at AT TIME ZONE ${timeZone})::date AS month,
          COUNT(*)::bigint AS count
        FROM "idea"
        WHERE "status" = ${IdeaStatus.PUBLISHED}
          AND "published_at" IS NOT NULL
          AND "published_at" >= ${start}
          AND "published_at" <= ${end}
        GROUP BY 1
      )
      SELECT buckets.month, COALESCE(counts.count, 0)::bigint AS count
      FROM buckets
      LEFT JOIN counts ON counts.month = buckets.month
      ORDER BY buckets.month ASC
    `;

    return rows.map(row => ({
      label: formatChartBucketLabel(row.month, timeZone, 'month'),
      value: Number(row.count),
    }));
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

  private async getStageDistribution(): Promise<StatisticsStatusChange[]> {
    const grouped = await this.prisma.idea.groupBy({
      by: ['stage'],
      where: {
        ...PUBLISHED_IDEA_WHERE,
        stage: { not: null },
      },
      _count: { _all: true },
    });

    const countsByStage = new Map<Stage, number>(
      grouped
        .filter(
          (row): row is typeof row & { stage: Stage } => row.stage !== null,
        )
        .map(row => [row.stage, row._count._all]),
    );

    const counts = STAGE_ORDER.map(stage => countsByStage.get(stage) ?? 0);
    const percents = this.distributeRoundedPercents(counts);

    return STAGE_ORDER.map((stage, index) => ({
      label: STAGE_LABELS[stage],
      percent: percents[index],
    }));
  }

  private distributeRoundedPercents(weights: number[]): number[] {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total === 0) {
      return weights.map(() => 0);
    }

    const exact = weights.map(weight => (weight / total) * 100);
    const floors = exact.map(value => Math.floor(value));
    let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);

    const ranked = exact
      .map((value, index) => ({ index, fraction: value - floors[index] }))
      .sort((a, b) => b.fraction - a.fraction);

    const result = [...floors];
    for (const { index } of ranked) {
      if (remainder === 0) {
        break;
      }
      result[index] += 1;
      remainder -= 1;
    }

    return result;
  }

  private async countNewUsers(start: Date, end: Date): Promise<number> {
    return this.prisma.user.count({
      where: { createdAt: { gte: start, lte: end } },
    });
  }

  private async countActiveUsers(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT "author_id" AS user_id
        FROM "idea"
        WHERE (
          ("published_at" >= ${start} AND "published_at" <= ${end})
          OR ("updated_at" >= ${start} AND "updated_at" <= ${end})
        )
        UNION
        SELECT "author_id" AS user_id
        FROM "problem"
        WHERE (
          ("published_at" >= ${start} AND "published_at" <= ${end})
          OR ("updated_at" >= ${start} AND "updated_at" <= ${end})
        )
      ) AS active_users
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async countIdeaUpdates(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "idea"
      WHERE "status" = ${IdeaStatus.PUBLISHED}
        AND "published_at" IS NOT NULL
        AND "updated_at" >= ${start}
        AND "updated_at" <= ${end}
        AND "updated_at" > "published_at"
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async getTopContributors(): Promise<StatisticsContributor[]> {
    const ranked = await this.prisma.$queryRaw<ContributorScoreRow[]>`
      SELECT
        "author_id",
        (
          COALESCE(SUM("view_count"), 0) +
          COALESCE(SUM("like_count"), 0) +
          COALESCE(SUM("comment_count"), 0)
        )::bigint AS score
      FROM "idea"
      WHERE "status" = ${IdeaStatus.PUBLISHED}
      GROUP BY "author_id"
      HAVING (
        COALESCE(SUM("view_count"), 0) +
        COALESCE(SUM("like_count"), 0) +
        COALESCE(SUM("comment_count"), 0)
      ) > 0
      ORDER BY score DESC
      LIMIT 3
    `;

    if (ranked.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ranked.map(row => row.author_id) } },
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
      const user = usersById.get(row.author_id);
      const score = Number(row.score);

      return {
        id: row.author_id,
        name: this.formatContributorName(user),
        score,
        avatarUrl: user?.avatarUrl ?? null,
      };
    });
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
}
