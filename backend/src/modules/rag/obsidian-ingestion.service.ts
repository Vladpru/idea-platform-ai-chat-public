import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export interface IngestResult {
  filesProcessed: number;
  chunksProcessed: number;
}

@Injectable()
export class ObsidianIngestionService {
  private readonly logger = new Logger(ObsidianIngestionService.name);
  private readonly vaultPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly config: ConfigService,
  ) {
    this.vaultPath = this.config.getOrThrow<string>('OBSIDIAN_VAULT_PATH');
  }

  async ingestAll(): Promise<IngestResult> {
    const files = this.collectMarkdownFiles(this.vaultPath);
    this.logger.log(`Found ${files.length} markdown files in vault`);

    let chunksProcessed = 0;

    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const text = this.stripFrontmatter(raw);
      const chunks = this.chunkText(text);
      const relativeSource = path.relative(this.vaultPath, filePath);

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        try {
          const vector = await this.embeddingService.embedText(chunk);
          const vectorLiteral = toPgVectorLiteral(vector);

          await this.prisma.$executeRaw`
            INSERT INTO knowledge_chunk (id, source, content, embedding, created_at)
            VALUES (gen_random_uuid(), ${relativeSource}, ${chunk}, ${vectorLiteral}::vector, NOW())
            ON CONFLICT DO NOTHING
          `;

          chunksProcessed++;
        } catch (error) {
          this.logger.error(
            `Failed to embed chunk from ${relativeSource}`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      this.logger.log(
        `Ingested ${chunks.length} chunks from ${relativeSource}`,
      );
    }

    return { filesProcessed: files.length, chunksProcessed };
  }

  private collectMarkdownFiles(dir: string): string[] {
    const results: string[] = [];

    if (!fs.existsSync(dir)) {
      this.logger.warn(`Obsidian vault path does not exist: ${dir}`);
      return results;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...this.collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }

    return results;
  }

  private stripFrontmatter(text: string): string {
    if (!text.startsWith('---')) return text;
    const end = text.indexOf('\n---', 3);
    if (end === -1) return text;
    return text.slice(end + 4).trimStart();
  }

  private chunkText(text: string): string[] {
    const paragraphs = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
      if (current.length + paragraph.length + 2 <= CHUNK_SIZE) {
        current = current ? `${current}\n\n${paragraph}` : paragraph;
      } else {
        if (current) {
          chunks.push(current);
          const overlap = current.slice(-CHUNK_OVERLAP);
          current = overlap ? `${overlap}\n\n${paragraph}` : paragraph;
        } else {
          for (
            let i = 0;
            i < paragraph.length;
            i += CHUNK_SIZE - CHUNK_OVERLAP
          ) {
            chunks.push(paragraph.slice(i, i + CHUNK_SIZE));
          }
          current = '';
        }
      }
    }

    if (current) chunks.push(current);

    return chunks;
  }
}
