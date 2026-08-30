import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token (JWT) returned from Google Identity Services',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class SignUpDto {
  @ApiProperty({ description: 'Full name of user', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Work email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password (min 6 characters)', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Optional custom workspace name',
    example: 'Acme Corp',
  })
  @IsString()
  @IsOptional()
  workspaceName?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Work email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Account password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class WorkspaceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  role: string;

  @ApiPropertyOptional()
  inviteCode?: string;

  @ApiPropertyOptional()
  memberCount?: number;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    status: string;
    timezone: string;
    teamIds: string[];
  };

  @ApiPropertyOptional({ type: WorkspaceResponseDto })
  workspace?: WorkspaceResponseDto;

  @ApiPropertyOptional({
    description: 'Indicates if the user was just created and needs onboarding',
    example: true,
  })
  isNewUser?: boolean;
}

export class GoogleAuthResponseDto extends AuthResponseDto {}
