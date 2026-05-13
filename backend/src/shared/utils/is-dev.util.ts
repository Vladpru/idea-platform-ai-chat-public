import { ConfigService } from '@nestjs/config';

export const isDev = (config: ConfigService) => {
  return config.getOrThrow<string>('NODE_ENV') === 'development';
};
