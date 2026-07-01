import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';
import type { IIngestionService } from './ingestion.interface';
import { collectVaultFiles } from './lib/collect-vault-files.util';
import { computeFileHash } from './lib/file-hash.util';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 150;

export interface IngestResult {
  filesProcessed: number;
  chunksProcessed: number;
}

export interface NoteFrontmatter {
  [key: string]: unknown;
}

@Injectable()
export class ObsidianIngestionService implements IIngestionService {
  private readonly logger = new Logger(ObsidianIngestionService.name);
  readonly vaultPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly config: ConfigService,
  ) {
    this.vaultPath = this.config.getOrThrow<string>('OBSIDIAN_VAULT_PATH');
  }

  async ingestAll(): Promise<IngestResult> {
    const files = collectVaultFiles(this.vaultPath);
    this.logger.log(`Found ${files.length} markdown files in vault`);
    let chunksProcessed = 0;

    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const fileHash = computeFileHash(raw);
      const relativeSource = path.relative(this.vaultPath, filePath);

      const count = await this.ingestFile(filePath, fileHash, raw);
      chunksProcessed += count;
      this.logger.log(`Ingested ${count} chunks from ${relativeSource}`);
    }

    return { filesProcessed: files.length, chunksProcessed };
  }

  async ingestFile(
    filePath: string,
    fileHash: string,
    rawContent?: string,
  ): Promise<number> {
    const raw = rawContent ?? fs.readFileSync(filePath, 'utf-8');
    const { text, frontmatter } = this.extractFrontmatter(raw);
    const chunks = this.chunkText(text);
    const relativeSource = path.relative(this.vaultPath, filePath);
    const metadataJson = JSON.stringify(frontmatter);

    const embedded: { chunk: string; vectorLiteral: string }[] = [];
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      try {
        const vector = await this.embeddingService.embedText(chunk);
        embedded.push({ chunk, vectorLiteral: toPgVectorLiteral(vector) });
      } catch (error) {
        this.logger.error(
          `Failed to embed chunk from ${relativeSource}`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    await this.prisma.$transaction(async tx => {
      await tx.$executeRaw`DELETE FROM knowledge_chunk WHERE source = ${relativeSource}`;
      for (const { chunk, vectorLiteral } of embedded) {
        await tx.$executeRaw`
          INSERT INTO knowledge_chunk (id, source, content, embedding, metadata, file_hash, created_at)
          VALUES (gen_random_uuid(), ${relativeSource}, ${chunk}, ${vectorLiteral}::vector, ${metadataJson}::jsonb, ${fileHash}, NOW())
        `;
      }
    });

    return embedded.length;
  }

  private extractFrontmatter(raw: string): {
    text: string;
    frontmatter: NoteFrontmatter;
  } {
    if (!raw.startsWith('---')) return { text: raw, frontmatter: {} };
    const end = raw.indexOf('\n---', 3);
    if (end === -1) return { text: raw, frontmatter: {} };

    const yamlBlock = raw.slice(3, end).trim();
    const text = raw.slice(end + 4).trimStart();
    const frontmatter: NoteFrontmatter = {};

    for (const line of yamlBlock.split('\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const key = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      if (key) frontmatter[key] = value;
    }

    return { text, frontmatter };
  }

  private chunkText(text: string): string[] {
    const sections = this.splitIntoSections(text);
    const chunks: string[] = [];

    for (const section of sections) {
      if (section.length <= CHUNK_SIZE) {
        chunks.push(section);
      } else {
        chunks.push(...this.splitSection(section));
      }
    }

    return chunks;
  }

  private splitIntoSections(text: string): string[] {
    const lines = text.split('\n');
    const sections: string[] = [];
    let current = '';

    for (const line of lines) {
      if (/^#{1,6}\s/.test(line) && current.trim()) {
        sections.push(current.trimEnd());
        current = line + '\n';
      } else {
        current += line + '\n';
      }
    }

    if (current.trim()) sections.push(current.trimEnd());

    return sections.filter(s => s.trim());
  }

  private splitSection(text: string): string[] {
    const paragraphs = this.splitParagraphsRespectingCodeBlocks(text);
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

    if (current.trim()) chunks.push(current);

    return chunks;
  }

  private splitParagraphsRespectingCodeBlocks(text: string): string[] {
    const result: string[] = [];
    const codeBlockRegex = /```[\s\S]*?```/g;
    let lastIndex = 0;

    for (const match of text.matchAll(codeBlockRegex)) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        result.push(
          ...before
            .split(/\n{2,}/)
            .map(p => p.trim())
            .filter(Boolean),
        );
      }
      result.push(match[0].trim());
      lastIndex = (match.index ?? 0) + match[0].length;
    }

    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
      result.push(
        ...remaining
          .split(/\n{2,}/)
          .map(p => p.trim())
          .filter(Boolean),
      );
    }

    return result;
  }
}
