import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type CommentCreateRequest = {
  user: { id: string };
};

@Injectable()
export class CommentCreateThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: CommentCreateRequest): Promise<string> {
    return Promise.resolve(req.user.id);
  }
}
