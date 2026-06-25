import { ApiProperty } from '@nestjs/swagger';

export class ChatSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ChatMessageSourceDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  relevance: number;
}

export class ChatMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [ChatMessageSourceDto] })
  sources: ChatMessageSourceDto[];

  @ApiProperty()
  createdAt: Date;
}
