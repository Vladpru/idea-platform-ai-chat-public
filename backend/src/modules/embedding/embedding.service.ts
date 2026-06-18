import { GoogleGenAI } from '@google/genai';
import {
  GatewayTimeoutException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import embeddingConfig from '../../core/config/embedding.config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly dimensions: number;

  constructor(
    @Inject(embeddingConfig.KEY)
    private readonly embeddingCfg: ConfigType<typeof embeddingConfig>,
  ) {
    this.client = new GoogleGenAI({
      apiKey: this.embeddingCfg.apiKey,
    });
    this.model = this.embeddingCfg.model;
    this.timeoutMs = this.embeddingCfg.timeoutMs;
    this.dimensions = this.embeddingCfg.dimensions;
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
      config: { outputDimensionality: this.dimensions },
    });

    try {
      const response = await Promise.race([embedPromise, timeoutPromise]);

      const values = response.embeddings?.[0]?.values;
      if (!values || values.length !== this.dimensions) {
        this.logger.error(
          `Unexpected embedding response: got ${values?.length ?? 0} dimensions`,
        );
        throw new InternalServerErrorException(
          `Expected ${this.dimensions} embedding dimensions`,
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
