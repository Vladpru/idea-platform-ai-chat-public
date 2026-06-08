import { Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { StatisticsBucketGranularity } from '../shared/types/statistics.types';
import {
  getBucketExpression,
  getBucketSeriesExpression,
} from './lib/query/bucket-sql.util';
import type { BucketCountRow } from './lib/query/query.types';

type BucketQueryParams = {
  granularity: StatisticsBucketGranularity;
  start: Date;
  end: Date;
  timeZone: string;
  sourceSql: Prisma.Sql;
};

@Injectable()
export class StatisticsBucketRepository {
  constructor(private readonly prisma: PrismaService) {}

  queryBucketedCounts(params: BucketQueryParams): Promise<BucketCountRow[]> {
    const bucketExpr = getBucketExpression(
      params.granularity,
      params.timeZone,
      'event_at',
    );
    const bucketSeries = getBucketSeriesExpression(
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

  queryDistinctBucketedCounts(
    params: BucketQueryParams & {
      eventColumn: string;
      userColumn: string;
    },
  ): Promise<BucketCountRow[]> {
    const bucketExpr = getBucketExpression(
      params.granularity,
      params.timeZone,
      params.eventColumn,
    );
    const bucketSeries = getBucketSeriesExpression(
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
}
