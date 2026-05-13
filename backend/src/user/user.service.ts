import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import { LocalAvatarStorageService } from '../storage/local-avatar-storage.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UpsertOAuthUserInput } from './dto/upsert-oauth-user.dto';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  realName: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarStorage: LocalAvatarStorageService,
  ) {}

  async create(dto: CreateUserDto) {
    if (await this.getByEmail(dto.email)) {
      throw new ConflictException('User with this email already exists');
    }
    if (!dto.password) {
      throw new BadRequestException('Password must be provided');
    }
    try {
      const hashedPassword = await hash(dto.password);
      return this.prisma.user.create({
        data: {
          email: dto.email,
          realName: dto.realName,
          password: hashedPassword,
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async verifyUser(email: string, password: string) {
    const user = await this.getByEmail(email);
    const invalid = new UnauthorizedException('Invalid email or password');
    if (!user || !user.password) {
      throw invalid;
    }
    if (!(await verify(user.password, password))) {
      throw invalid;
    }
    return { ...user };
  }

  async upsertOAuthUser(dto: UpsertOAuthUserInput) {
    return await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        realName: dto.realName,
        avatarUrl: dto.avatar_url,
      },
      create: {
        email: dto.email,
        realName: dto.realName,
        avatarUrl: dto.avatar_url,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('Id required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async getProfileForUser(id: string) {
    if (!id) {
      throw new BadRequestException('Id required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async finalizeAvatarUpload(
    userId: string,
    storedFilename: string | undefined,
  ) {
    if (!storedFilename) {
      throw new BadRequestException('Missing file (use form field "file").');
    }
    await this.findOne(userId);
    await this.avatarStorage.removeStaleAvatarVariants(userId, storedFilename);
    const avatarUrl = this.avatarStorage.publicUrlForFilename(storedFilename);
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: USER_PUBLIC_SELECT,
    });
  }

  async setAvatarUrl(id: string, avatarUrl: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  getByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email required');
    }
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
