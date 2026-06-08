import { Injectable } from '@nestjs/common';

import type {
  LeaderboardResponse,
  StatisticsPeriod,
  StatisticsSnapshotResponse,
} from '../shared/types/statistics.types';
import { buildChartPanel, sumSeriesPoints } from './lib/chart/chart-panel.util';
import { resolveStatisticsBucketGranularity } from './lib/period/granularity.util';
import { resolveStatisticsPeriodRange } from './lib/period/period.util';
import { resolveStatisticsTimeZone } from './lib/period/timezone.util';
import { StatisticsChartsRepository } from './statistics-charts.repository';
import { StatisticsScoringRepository } from './statistics-scoring.repository';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly charts: StatisticsChartsRepository,
    private readonly scoring: StatisticsScoringRepository,
  ) {}

  async getSnapshot(
    period: StatisticsPeriod,
    userId: string,
    timeZoneRaw?: string,
  ): Promise<StatisticsSnapshotResponse> {
    const timeZone = resolveStatisticsTimeZone(timeZoneRaw);
    const allTimeStart =
      period === 'all_time'
        ? await this.charts.getEarliestPublishedAt()
        : undefined;
    const range = resolveStatisticsPeriodRange(
      period,
      timeZone,
      new Date(),
      allTimeStart ?? undefined,
    );
    const granularity = resolveStatisticsBucketGranularity(
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
    } = await this.charts.fetchChartSeries(
      granularity,
      range.start,
      range.end,
      timeZone,
    );

    const newIdeasTotal = sumSeriesPoints(ideasSeries.points);
    const newProblemsTotal = sumSeriesPoints(problemsSeries.points);
    const newUsersTotal = sumSeriesPoints(newUsersSeries.points);
    const updatesTotal = sumSeriesPoints(updatesSeries.points);
    const commentsTotal = sumSeriesPoints(commentsSeries.points);
    const [activeUsersTotal, topContributors, costBenefitTotal, myScore] =
      await Promise.all([
        this.charts.countActiveUsers(range.start, range.end),
        this.scoring.getTopContributors(range.start, range.end),
        this.charts.getCostBenefitTotal(range.start, range.end),
        this.scoring.getMyScore(userId, range.start, range.end),
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
      myScore,
    };
  }

  async getLeaderboard(
    period: StatisticsPeriod,
    timeZoneRaw?: string,
  ): Promise<LeaderboardResponse> {
    const timeZone = resolveStatisticsTimeZone(timeZoneRaw);
    const allTimeStart =
      period === 'all_time'
        ? await this.charts.getEarliestPublishedAt()
        : undefined;
    const range = resolveStatisticsPeriodRange(
      period,
      timeZone,
      new Date(),
      allTimeStart ?? undefined,
    );

    const entries = await this.scoring.queryLeaderboardEntries(
      range.start,
      range.end,
    );

    return { entries };
  }
}
