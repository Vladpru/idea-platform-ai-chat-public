import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @ApiProperty({ example: 'secret12345' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MaxLength(150, { message: 'Password is too long' })
  password!: string;
}
