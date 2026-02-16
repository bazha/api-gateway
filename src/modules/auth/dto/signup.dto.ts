import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
