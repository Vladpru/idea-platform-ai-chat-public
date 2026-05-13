import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AvatarUploadInterceptor } from './interceptors/avatar-upload.interceptor';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user' })
  @JwtAuth()
  getMe(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getProfileForUser(req.user.id);
  }

  @Post('me/avatar')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Avatar updated' })
  @JwtAuth()
  @UseInterceptors(AvatarUploadInterceptor())
  uploadMyAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.finalizeAvatarUpload(req.user.id, file?.filename);
  }

  @Post()
  @ApiCreatedResponse({ description: 'User created' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List of users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'User updated' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @JwtAuth()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }
}
