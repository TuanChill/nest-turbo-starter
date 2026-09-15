import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const LABEL_SCOPES = ['issue', 'project', 'both'] as const;
type LabelScope = (typeof LABEL_SCOPES)[number];

export class CreateLabelDto {
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

  @ApiPropertyOptional({ enum: LABEL_SCOPES, default: 'both' })
  @IsEnum(LABEL_SCOPES)
  @IsOptional()
  scope?: LabelScope;
}

export class UpdateLabelDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ enum: LABEL_SCOPES })
  @IsEnum(LABEL_SCOPES)
  @IsOptional()
  scope?: LabelScope;
}
