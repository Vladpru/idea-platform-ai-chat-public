import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';

import { Prisma, ThemePreference } from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { NotificationPreferencesMap } from '../notification/events/notification.events';
import {
  mergeNotificationPreferences,
  parseNotificationPreferences,
} from '../notification/lib/notification-preferences.util';
import { PrismaService } from '../prisma/prisma.service';
import type { UserPublic, UserPublicProfile } from '../shared/types/user.types';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import {
  PASSWORD_MAX_LENGTH,
  validateNewPassword,
} from '../shared/utils/validate-password.util';
import { SubscriptionService } from '../subscription/subscription.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type {
  UpsertOAuthUserInput,
  UpsertOAuthUserResult,
} from './dto/upsert-oauth-user.dto';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  themePreference: true,
  notificationPreferences: true,
  bio: true,
  socialLinks: true,
  createdAt: true,
  updatedAt: true,
} as const;

function parseSocialLinks(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function toUserPublic(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
  notificationPreferences: unknown;
  bio: string | null;
  socialLinks: unknown;
  createdAt: Date;
  updatedAt: Date;
}): UserPublic {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    themePreference: user.themePreference,
    notificationPreferences: parseNotificationPreferences(
      user.notificationPreferences as Parameters<
        typeof parseNotificationPreferences
      >[0],
    ),
    bio: user.bio,
    socialLinks: parseSocialLinks(user.socialLinks),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(dto: CreateUserDto) {
    if (!dto.password) {
      throw new BadRequestException('Password must be provided');
    }

    const hashedPassword = await hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
        },
        select: USER_PUBLIC_SELECT,
      });
      return toUserPublic(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async verifyUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, password: true },
    });

    const invalid = new UnauthorizedException('Invalid email or password');

    if (!user || !user.password) throw invalid;
    if (!(await verify(user.password, password.trim()))) throw invalid;

    return user;
  }

  async upsertOAuthUser(
    dto: UpsertOAuthUserInput,
  ): Promise<UpsertOAuthUserResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    const userRecord = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {},
      create: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      },
      select: USER_PUBLIC_SELECT,
    });

    const user = toUserPublic(userRecord);

    return { user, isNewUser: existing === null };
  }

  async findAll(limit: number = 50, cursor?: string) {
    const users = cursor
      ? await this.prisma.user.findMany({
          take: limit,
          skip: 1,
          cursor: { id: cursor },
          orderBy: { createdAt: 'desc' },
          select: USER_PUBLIC_SELECT,
        })
      : await this.prisma.user.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: USER_PUBLIC_SELECT,
        });

    return users.map(toUserPublic);
  }

  async findOne(id: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException(`User not found`);
    return toUserPublic(user);
  }

  async getPublicProfile(
    id: string,
    currentUserId: string,
  ): Promise<UserPublicProfile> {
    const user = await this.findOne(id);
    const subscriberCount =
      await this.subscriptionService.getSubscriberCount(id);
    const isSubscribed =
      currentUserId !== id
        ? await this.subscriptionService.isSubscribed(currentUserId, id)
        : false;

    return {
      ...user,
      subscriberCount,
      isSubscribed,
    };
  }

  getProfileForUser(id: string): Promise<UserPublic> {
    return this.findOne(id);
  }

  async finalizeAvatarUpload(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secureUrl = await this.cloudinary.uploadAvatar(file);

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: secureUrl },
        select: USER_PUBLIC_SELECT,
      });

      if (user.avatarUrl) {
        void this.cloudinary.deleteAvatar(user.avatarUrl).catch(() => null);
      }

      return toUserPublic(updated);
    } catch (error) {
      void this.cloudinary.deleteAvatar(secureUrl).catch(() => null);
      throw error;
    }
  }

  async removeAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: USER_PUBLIC_SELECT,
    });

    if (user.avatarUrl) {
      void this.cloudinary.deleteAvatar(user.avatarUrl).catch(() => null);
    }

    return toUserPublic(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;

    if (typeof currentPassword !== 'string' || !currentPassword) {
      throw new BadRequestException('Passwords are required');
    }

    if (currentPassword.length > PASSWORD_MAX_LENGTH) {
      throw new BadRequestException(
        `Current password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      );
    }

    const validatedNewPassword = validateNewPassword(
      newPassword,
      'New password',
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.password) {
      throw new BadRequestException(
        'This account has no password. Sign in with Google or set a password another way.',
      );
    }

    const invalid = new UnauthorizedException('Current password is incorrect');

    if (!(await verify(user.password, currentPassword))) {
      throw invalid;
    }

    if (currentPassword === validatedNewPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedPassword = await hash(validatedNewPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async updateTheme(userId: string, theme: ThemePreference) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { themePreference: theme },
      select: USER_PUBLIC_SELECT,
    });

    return toUserPublic(user);
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<{ notificationPreferences: NotificationPreferencesMap }> {
    return this.prisma.$transaction(async tx => {
      const lockedRows = await tx.$queryRaw<
        Array<{ notification_preferences: Prisma.JsonValue }>
      >`
        SELECT notification_preferences
        FROM "user"
        WHERE id = ${userId}
        FOR UPDATE
      `;

      const row = lockedRows[0];

      if (!row) {
        throw new NotFoundException('User not found');
      }

      const current = parseNotificationPreferences(
        row.notification_preferences,
      );
      const merged = mergeNotificationPreferences(
        current,
        dto as Partial<NotificationPreferencesMap>,
      );

      await tx.user.update({
        where: { id: userId },
        data: { notificationPreferences: merged },
      });

      return { notificationPreferences: merged };
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName;
    }

    if (dto.bio !== undefined) {
      data.bio = dto.bio;
    }

    if (dto.socialLinks !== undefined) {
      data.socialLinks = dto.socialLinks;
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        select: USER_PUBLIC_SELECT,
      });
      return toUserPublic(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async checkUserPassword(userId: string) {
    const user = await this.findOneWithPassword(userId);
    return !!user.password;
  }

  private async findOneWithPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }
}
