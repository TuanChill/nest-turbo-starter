import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInitiativeDto {
  @ApiPropertyOptional({ example: 'circle-workspace' })
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'component-platform' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Q3 — Ship the component platform' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Deliver the full core component suite with stable APIs and docs.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '🧱' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ enum: ['active', 'planned', 'completed'], default: 'active' })
  @IsEnum(['active', 'planned', 'completed'])
  status: 'active' | 'planned' | 'completed';

  @ApiPropertyOptional({ default: 'no-priority' })
  @IsString()
  @IsOptional()
  priorityId?: string;

  @ApiPropertyOptional({ example: 'ln' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'Q3 2026' })
  @IsString()
  @IsOptional()
  target?: string;

  @ApiPropertyOptional({ default: 'on-track' })
  @IsString()
  @IsOptional()
  healthId?: string;

  @ApiPropertyOptional({ type: [String], example: ['1', '2', '3'] })
  @IsArray()
  @IsOptional()
  projectIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  resources?: any[];
}

export class UpdateInitiativeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string | null;

  @ApiPropertyOptional({ enum: ['active', 'planned', 'completed'] })
  @IsEnum(['active', 'planned', 'completed'])
  @IsOptional()
  status?: 'active' | 'planned' | 'completed';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priorityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ownerId?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  target?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  healthId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  projectIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  resources?: any[];
}

export class CreateInitiativeUpdateDto {
  @ApiPropertyOptional({ default: 'on-track' })
  @IsEnum(['no-update', 'on-track', 'at-risk', 'off-track'])
  health: 'no-update' | 'on-track' | 'at-risk' | 'off-track';

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  blocks?: any[];
}

export class UpdateInitiativeUpdateDto {
  @ApiPropertyOptional({ enum: ['no-update', 'on-track', 'at-risk', 'off-track'] })
  @IsEnum(['no-update', 'on-track', 'at-risk', 'off-track'])
  @IsOptional()
  health?: 'no-update' | 'on-track' | 'at-risk' | 'off-track';

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  blocks?: any[];
}

export class InitiativeUpdateReactionDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
