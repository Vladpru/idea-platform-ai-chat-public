import {
  BadRequestException,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  createParamDecorator,
} from '@nestjs/common';
import type { Request } from 'express';

export const IfMatch = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const raw = req.header('if-match');

    if (!raw || raw.trim().length === 0) {
      throw new HttpException(
        'If-Match header is required',
        HttpStatus.PRECONDITION_REQUIRED, // 428
      );
    }
    if (raw.trim() === '*') {
      throw new BadRequestException(
        'If-Match: * is not supported for versioned updates',
      );
    }

    const normalized = raw
      .trim()
      .replace(/^W\//i, '')
      .replace(/^"(.*)"$/, '$1');
    const version = Number(normalized);

    if (!Number.isInteger(version) || version < 1) {
      throw new BadRequestException(
        'If-Match must be a positive integer version',
      );
    }
    return version;
  },
);
