import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @ApiPropertyOptional({ example: 'John Doe', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  realName?: string;

  @ApiPropertyOptional({ example: 'secret123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional({ example: 'http://google.com/avatar' })
  @IsOptional()
  @IsString()
  avatar_url?: string;
}
