import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  validateEmail,
  validateNewPassword,
} from '../shared/utils/validate-password.util';

const GENERIC_FORGOT_MESSAGE =
  'If an account exists with this email, we sent password reset instructions.';

type PasswordResetCandidate = {
  id: string;
  userId: string;
  tokenHash: string;
};

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async requestPasswordReset(email: unknown) {
    const normalizedEmail = validateEmail(email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, password: true },
    });

    if (!user?.password) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = await hash(rawToken);
    const expiresMinutes = this.resetExpireMinutes();
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const record = await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
      select: { id: true },
    });

    const frontendUrl = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await this.mail.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        expiresMinutes,
      });
    } catch (error) {
      await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      this.logger.error('Failed to send password reset email', error);
      throw new ServiceUnavailableException(
        'Unable to send email, try again later',
      );
    }

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(token: unknown, newPassword: unknown) {
    if (typeof token !== 'string' || !token) {
      throw new BadRequestException('Reset token is required');
    }

    const password = validateNewPassword(newPassword, 'New password');

    const candidates = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true, tokenHash: true },
    });

    let matched: PasswordResetCandidate | null = null;

    for (const candidate of candidates) {
      try {
        if (
          await verify((candidate as PasswordResetCandidate).tokenHash, token)
        ) {
          matched = candidate;
          break;
        }
      } catch {
        // invalid hash format — skip
      }
    }

    if (!matched) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const hashedPassword = await hash(password);
    const { id: tokenId, userId } = matched;

    await this.prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      await tx.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId, usedAt: null, id: { not: tokenId } },
      });
    });

    return { message: 'Password updated successfully' };
  }

  private resetExpireMinutes(): number {
    const raw = this.config.get<string>('PASSWORD_RESET_EXPIRE_MINUTES');
    const parsed = raw ? Number.parseInt(raw, 10) : 30;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
  }
}
