import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import type { UserPublic } from '../shared/types/user.types';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import {
  PASSWORD_MAX_LENGTH,
  validateNewPassword,
} from '../shared/utils/validate-password.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ThemePreference } from '../../generated/prisma/client';
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
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(dto: CreateUserDto) {
    if (!dto.password) {
      throw new BadRequestException('Password must be provided');
    }

    const hashedPassword = await hash(dto.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
        },
        select: USER_PUBLIC_SELECT,
      });
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

    const user: UserPublic = await this.prisma.user.upsert({
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

    return { user, isNewUser: existing === null };
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: USER_PUBLIC_SELECT,
    });
  }

  async findOne(id: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }

  getProfileForUser(id: string): Promise<UserPublic> {
    return this.findOne(id);
  }

  async finalizeAvatarUpload(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.avatarUrl) {
      await this.cloudinary.deleteAvatar(user.avatarUrl);
    }

    const secureUrl = await this.cloudinary.uploadAvatar(file);

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: secureUrl },
      select: USER_PUBLIC_SELECT,
    });
  }

  async removeAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    if (user.avatarUrl) {
      await this.cloudinary.deleteAvatar(user.avatarUrl);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: USER_PUBLIC_SELECT,
    });
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
    return this.prisma.user.update({
      where: { id: userId },
      data: { themePreference: theme },
      select: USER_PUBLIC_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: { firstName?: string; lastName?: string } = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: USER_PUBLIC_SELECT,
      });
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
