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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UpsertOAuthUserInput } from './dto/upsert-oauth-user.dto';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
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
          email: dto.email,
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
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    const invalid = new UnauthorizedException('Invalid email or password');

    if (!user || !user.password) throw invalid;
    if (!(await verify(user.password, password))) throw invalid;

    return user;
  }

  async upsertOAuthUser(dto: UpsertOAuthUserInput) {
    return await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      },
      create: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      },
      select: USER_PUBLIC_SELECT,
    });
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

  private getByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
