import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'LNDev UI - Core Components' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CORE' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiPropertyOptional({ example: 'mason' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ default: 'in-progress' })
  @IsString()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional({ default: 'started' })
  @IsString()
  @IsOptional()
  statusCategory?: string;

  @ApiPropertyOptional({ default: 'no-priority' })
  @IsString()
  @IsOptional()
  priorityId?: string;

  @ApiPropertyOptional({ default: 'on-track' })
  @IsString()
  @IsOptional()
  healthId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  percentComplete?: number;

  @ApiPropertyOptional({ default: 'Cuboid' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '2025-03-08' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsString()
  @IsOptional()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initiativeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  labelIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Workspace members assigned to the project',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  description?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  resources?: any[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  statusCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priorityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  healthId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  percentComplete?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initiativeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  labelIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Replace the project member set' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  description?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  resources?: any[];
}

export class CreateProjectUpdateDto {
  @ApiProperty({ enum: ['on-track', 'at-risk', 'off-track'], default: 'on-track' })
  @IsEnum(['on-track', 'at-risk', 'off-track'])
  health: 'on-track' | 'at-risk' | 'off-track';

  @ApiProperty({
    type: Array,
    example: [{ type: 'paragraph', text: 'Sprint on schedule.' }],
  })
  @IsArray()
  @Type(() => Object)
  blocks: any[];
}

export class ReplaceProjectMembersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  memberIds: string[];
}

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Alpha Release' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '2025-04-15' })
  @IsString()
  @IsOptional()
  targetDate?: string;
}
