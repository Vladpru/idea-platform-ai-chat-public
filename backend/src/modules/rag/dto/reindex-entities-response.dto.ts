import { ApiProperty } from '@nestjs/swagger';

export class ReindexEntitiesResponseDto {
  @ApiProperty()
  synced: number;

  @ApiProperty()
  removed: number;
}
