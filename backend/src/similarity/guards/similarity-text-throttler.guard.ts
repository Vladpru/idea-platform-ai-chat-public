import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class SimilarityTextThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sourceId = request.query.sourceId;

    if (typeof sourceId === 'string' && sourceId.length > 0) {
      return true;
    }

    return super.canActivate(context);
  }
}
