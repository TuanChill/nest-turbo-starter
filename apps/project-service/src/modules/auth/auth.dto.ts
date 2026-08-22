import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
   @ApiProperty({ description: 'Google ID token (JWT) returned from Google Identity Services' })
   @IsString()
   @IsNotEmpty()
   idToken: string;

   @ApiPropertyOptional({ description: 'Optional user fallback profile if provided' })
   @IsOptional()
   profile?: {
      email?: string;
      name?: string;
      picture?: string;
   };
}

export class GoogleAuthResponseDto {
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
}
