import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @ApiPropertyOptional({ example: 'ln' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'leonel.ngoya' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'leonelngoya@gmail.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'https://api.dicebear.com/9.x/glass/svg?seed=ln' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: ['online', 'offline', 'away'], default: 'offline' })
  @IsEnum(['online', 'offline', 'away'])
  @IsOptional()
  status?: 'online' | 'offline' | 'away';

  @ApiPropertyOptional({
    enum: ['Member', 'Admin', 'Guest', 'Application'],
    default: 'Member',
  })
  @IsEnum(['Member', 'Admin', 'Guest', 'Application'])
  @IsOptional()
  role?: 'Member' | 'Admin' | 'Guest' | 'Application';

  @ApiPropertyOptional({ example: 'Europe/Paris' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: ['CORE'] })
  @IsOptional()
  teamIds?: string[];

  @ApiPropertyOptional({ example: 'my-workspace-1' })
  @IsString()
  @IsOptional()
  workspaceId?: string;
}

export class UpdateMemberDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: ['online', 'offline', 'away'] })
  @IsEnum(['online', 'offline', 'away'])
  @IsOptional()
  status?: 'online' | 'offline' | 'away';

  @ApiPropertyOptional({ enum: ['Member', 'Admin', 'Guest', 'Application'] })
  @IsEnum(['Member', 'Admin', 'Guest', 'Application'])
  @IsOptional()
  role?: 'Member' | 'Admin' | 'Guest' | 'Application';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;
}
