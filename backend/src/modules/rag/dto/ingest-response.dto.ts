import { ApiProperty } from '@nestjs/swagger';

export class IngestResponseDto {
  @ApiProperty()
  filesProcessed: number;

  @ApiProperty()
  chunksProcessed: number;
}
