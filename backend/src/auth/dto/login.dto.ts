import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'secret12345' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MaxLength(150, { message: 'Password is too long' })
  password!: string;
}
