import { GoogleGenAI } from '@google/genai';
import {
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
const DEFAULT_EMBEDDING_TIMEOUT_MS = 15_000;

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.getOrThrow<string>('GEMINI_API_KEY').trim(),
    });

    this.model =
      this.config.get<string>('GEMINI_EMBEDDING_MODEL')?.trim() ??
      DEFAULT_EMBEDDING_MODEL;

    const raw = this.config.get<string>('GEMINI_EMBEDDING_TIMEOUT_MS');
    const parsed =
      raw !== undefined ? Number(raw) : DEFAULT_EMBEDDING_TIMEOUT_MS;
    this.timeoutMs =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_EMBEDDING_TIMEOUT_MS;
  }

  async embedText(text: string): Promise<number[]> {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(new GatewayTimeoutException('Embedding generation timed out'));
      }, this.timeoutMs);
    });

    const embedPromise = this.client.models.embedContent({
      model: this.model,
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });

    try {
      const response = await Promise.race([embedPromise, timeoutPromise]);

      const values = response.embeddings?.[0]?.values;
      if (!values || values.length !== EMBEDDING_DIMENSIONS) {
        this.logger.error(
          `Unexpected embedding response: got ${values?.length ?? 0} dimensions`,
        );
        throw new InternalServerErrorException(
          `Expected ${EMBEDDING_DIMENSIONS} embedding dimensions`,
        );
      }

      return values;
    } finally {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    }
  }
}
