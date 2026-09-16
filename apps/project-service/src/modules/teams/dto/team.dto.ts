import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiPropertyOptional({ example: 'MOBILE' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Mobile Development' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '📱', default: '⚡' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#5e6ad2' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  joined?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['ln', 'mason'] })
  @IsOptional()
  memberIds?: string[];

  @ApiProperty({ description: 'Workspace that owns the team' })
  @IsString()
  workspaceId: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  estimateEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['exponential', 'fibonacci', 'linear', 't-shirt'] })
  @IsEnum(['exponential', 'fibonacci', 'linear', 't-shirt'])
  @IsOptional()
  estimateScale?: 'exponential' | 'fibonacci' | 'linear' | 't-shirt';

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  estimateExtended?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  estimateZero?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  unestimatedAsOne?: boolean;
}

export class UpdateTeamDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  joined?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  estimateEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['exponential', 'fibonacci', 'linear', 't-shirt'] })
  @IsEnum(['exponential', 'fibonacci', 'linear', 't-shirt'])
  @IsOptional()
  estimateScale?: 'exponential' | 'fibonacci' | 'linear' | 't-shirt';

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  estimateExtended?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  estimateZero?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  unestimatedAsOne?: boolean;
}

export class AddTeamMemberDto {
  @ApiProperty({ example: 'mason' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiPropertyOptional({ default: 'member' })
  @IsString()
  @IsOptional()
  role?: string;
}
