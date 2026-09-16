import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

const LABEL_SCOPES = ['issue', 'project', 'both'] as const;
type LabelScope = (typeof LABEL_SCOPES)[number];

export class CreateLabelDto {
  @ApiPropertyOptional({ example: 'circle-workspace' })
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'ENG2', nullable: true })
  @IsString()
  @IsOptional()
  teamId?: string;
  @ApiProperty({ example: 'ui' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'UI Enhancement' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'purple' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ enum: LABEL_SCOPES, default: 'both' })
  @IsEnum(LABEL_SCOPES)
  @IsOptional()
  scope?: LabelScope;
}

export class UpdateLabelDto {
  @ApiPropertyOptional({ description: 'Archive or restore the label' })
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @ApiPropertyOptional({ example: 'ENG2', nullable: true })
  @IsString()
  @IsOptional()
  teamId?: string | null;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ enum: LABEL_SCOPES })
  @IsEnum(LABEL_SCOPES)
  @IsOptional()
  scope?: LabelScope;
}

export class CreateLabelGroupDto {
  @ApiPropertyOptional({ example: 'circle-workspace' })
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @ApiProperty({ example: 'Priority' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: LABEL_SCOPES, default: 'issue' })
  @IsEnum(LABEL_SCOPES)
  @IsOptional()
  scope?: LabelScope;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  mutuallyExclusive?: boolean;
}

export class UpdateLabelGroupDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: LABEL_SCOPES })
  @IsEnum(LABEL_SCOPES)
  @IsOptional()
  scope?: LabelScope;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  mutuallyExclusive?: boolean;
}
