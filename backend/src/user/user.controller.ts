import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { GetContributionsQueryDto } from './dto/get-contributions-query.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AvatarUploadInterceptor } from './interceptors/avatar-upload.interceptor';
import { UserContributionsService } from './user-contributions.service';
import { UserService } from './user.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userContributionsService: UserContributionsService,
  ) {}

  @Get('me')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user profile' })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.userService.findOne(req.user.id);
  }

  @Patch('me')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'User profile updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateMe(@Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    return this.userService.update(req.user.id, dto);
  }

  @Get('me/has-password')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user has a password set' })
  @ApiOkResponse({
    description: 'Whether the user can sign in with email/password',
  })
  async hasPassword(@Req() req: AuthenticatedRequest) {
    const hasPassword = await this.userService.checkUserPassword(req.user.id);
    return { hasPassword };
  }

  @Post('me/avatar')
  @JwtAuth()
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
  @UseInterceptors(AvatarUploadInterceptor())
  uploadMyAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Missing file (use form field "file").');
    }
    return this.userService.finalizeAvatarUpload(req.user.id, file);
  }

  @Delete('me/avatar')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove current user avatar' })
  @ApiNoContentResponse({ description: 'Avatar removed' })
  removeMyAvatar(@Req() req: AuthenticatedRequest) {
    return this.userService.removeAvatar(req.user.id);
  }

  @Patch('me/theme')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user theme preference' })
  @ApiBody({ type: UpdateThemeDto })
  @ApiOkResponse({ description: 'Theme preference updated' })
  updateMyTheme(@Body() dto: UpdateThemeDto, @Req() req: AuthenticatedRequest) {
    return this.userService.updateTheme(req.user.id, dto.theme);
  }

  @Patch('me/notification-preferences')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user notification preferences' })
  @ApiBody({ type: UpdateNotificationPreferencesDto })
  @ApiOkResponse({ description: 'Notification preferences updated' })
  updateMyNotificationPreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userService.updateNotificationPreferences(req.user.id, dto);
  }

  @Patch('me/password')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Password updated successfully' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized or wrong current password',
  })
  changeMyPassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userService.changePassword(req.user.id, dto);
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

  @Get(':id/contributions')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List published ideas and problems by user' })
  @ApiOkResponse({ description: 'Paginated user contributions feed' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getContributions(
    @Param('id', ParseUUIDPipe) profileId: string,
    @Query() query: GetContributionsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userContributionsService.getContributions(
      profileId,
      query,
      req.user.id,
    );
  }

  @Get(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userService.getPublicProfile(id, req.user.id);
  }

  @Get(':id/statistics')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiOkResponse({ description: 'User statistics' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getUserStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.userContributionsService.getUserStatistics(id);
  }
}
