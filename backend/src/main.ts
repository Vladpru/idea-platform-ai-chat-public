import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ValidationError } from 'class-validator';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './core/adapters/redis-io.adapter';
import './instrument';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const config = app.get(ConfigService);

  const posthogHost = 'https://eu.i.posthog.com';
  const posthogAssetsHost = 'https://eu-assets.i.posthog.com';
  const rewriteIngest = (path: string) => path.replace(/^\/ingest/, '');

  app.use(
    '/ingest/static',
    createProxyMiddleware({
      target: posthogAssetsHost,
      changeOrigin: true,
      pathRewrite: rewriteIngest,
    }),
  );
  app.use(
    '/ingest/array',
    createProxyMiddleware({
      target: posthogAssetsHost,
      changeOrigin: true,
      pathRewrite: rewriteIngest,
    }),
  );
  app.use(
    '/ingest',
    createProxyMiddleware({
      target: posthogHost,
      changeOrigin: true,
      pathRewrite: rewriteIngest,
    }),
  );

  const redisIoAdapter = new RedisIoAdapter(app);
  const redisUrl = config.getOrThrow<string>('REDIS_URL');
  await redisIoAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks();

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formatErrors = (validationErrors: ValidationError[], parentProperty = '') => {
          const formattedErrors: Record<string, string[]> = {};
          
          validationErrors.forEach((error) => {
            const propertyPath = parentProperty ? `${parentProperty}.${error.property}` : error.property;
            
            if (error.constraints) {
              formattedErrors[propertyPath] = Object.values(error.constraints);
            }
            
            if (error.children && error.children.length > 0) {
              Object.assign(formattedErrors, formatErrors(error.children, propertyPath));
            }
          });
          
          return formattedErrors;
        };

        return new UnprocessableEntityException({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: formatErrors(errors),
        });
      },
    }),
  );

  app.enableCors({
    origin: [config.getOrThrow<string>('FRONTEND_URL')],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Idea platform api')
    .setDescription('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || config.get<number>('APP_PORT') || 3001;
  await app.listen(port);
}
void bootstrap();