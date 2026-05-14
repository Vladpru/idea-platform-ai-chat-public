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
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.getByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    if (!dto.password) {
      throw new BadRequestException('Password must be provided');
    }

    const hashedPassword = await hash(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashedPassword,
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  async verifyUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }

  getProfileForUser(id: string) {
    return this.findOne(id);
  }

  async removeAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: USER_PUBLIC_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
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
