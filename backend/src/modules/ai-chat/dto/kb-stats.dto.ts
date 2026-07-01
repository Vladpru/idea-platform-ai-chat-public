import { ApiProperty } from '@nestjs/swagger';

export class KbStatsDto {
  @ApiProperty()
  totalChunks: number;

  @ApiProperty()
  ideaChunks: number;

  @ApiProperty()
  problemChunks: number;

  @ApiProperty()
  vaultChunks: number;

  @ApiProperty({ nullable: true, type: String })
  lastSyncedAt: Date | null;

  @ApiProperty()
  embeddingCoveragePercent: number;
}
