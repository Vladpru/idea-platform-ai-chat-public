import type { IngestResult } from './obsidian-ingestion.service';

export const INGESTION_SERVICE = Symbol('INGESTION_SERVICE');

export interface IIngestionService {
  ingestAll(): Promise<IngestResult>;
}
