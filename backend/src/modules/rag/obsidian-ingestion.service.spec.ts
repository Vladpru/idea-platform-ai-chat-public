import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';

import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { ObsidianIngestionService } from './obsidian-ingestion.service';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ObsidianIngestionService.ingestFile', () => {
  let service: ObsidianIngestionService;
  let prisma: { $executeRaw: jest.Mock };
  let embeddingService: { embedText: jest.Mock };

  beforeEach(async () => {
    prisma = { $executeRaw: jest.fn().mockResolvedValue(undefined) };
    embeddingService = { embedText: jest.fn().mockResolvedValue(Array(768).fill(0.1)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObsidianIngestionService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmbeddingService, useValue: embeddingService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('/vault') },
        },
      ],
    }).compile();

    service = module.get<ObsidianIngestionService>(ObsidianIngestionService);
  });

  afterEach(() => jest.resetAllMocks());

  it('returns chunk count for plain text file', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFs.readFileSync.mockReturnValue('# Hello\n\nThis is a note.' as any);

    const count = await service.ingestFile('/vault/note.md', 'hash123');

    expect(count).toBeGreaterThan(0);
    expect(embeddingService.embedText).toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('returns 0 for file with only whitespace', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFs.readFileSync.mockReturnValue('   \n\n   ' as any);

    const count = await service.ingestFile('/vault/empty.md', 'hash456');

    expect(count).toBe(0);
    expect(embeddingService.embedText).not.toHaveBeenCalled();
  });

  it('strips frontmatter before embedding', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFs.readFileSync.mockReturnValue('---\ntitle: Secret\n---\n\nContent here.' as any);

    await service.ingestFile('/vault/meta.md', 'hash789');

    const [embeddedText] = embeddingService.embedText.mock.calls[0];
    expect(embeddedText).not.toContain('title: Secret');
    expect(embeddedText).toContain('Content here');
  });

  it('continues ingestion when one chunk embedding fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedFs.readFileSync.mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      '# Section 1\n\nFirst paragraph.\n\n# Section 2\n\nSecond paragraph.' as any,
    );
    embeddingService.embedText
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValue(Array(768).fill(0.1));

    const count = await service.ingestFile('/vault/partial.md', 'hashErr');

    expect(count).toBeGreaterThanOrEqual(1);
  });
});
