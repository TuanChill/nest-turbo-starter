import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ProjectTemplateConfig, ProjectTemplateScope } from '../../../data-access';

export class CreateProjectTemplateDto {
  @ApiProperty({ example: 'Product launch checklist' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['workspace', 'team'] })
  @IsEnum(['workspace', 'team'])
  scope: ProjectTemplateScope;

  @ApiProperty({ example: 'my-workspace' })
  @IsString()
  workspaceId: string;

  @ApiPropertyOptional({ example: 'ENG' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ type: Object })
  @IsObject()
  config: ProjectTemplateConfig;
}

export class UpdateProjectTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['workspace', 'team'] })
  @IsEnum(['workspace', 'team'])
  @IsOptional()
  scope?: ProjectTemplateScope;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  config?: ProjectTemplateConfig;
}

export class InstantiateProjectTemplateDto {
  @ApiProperty({ example: 'New product launch' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ENG' })
  @IsString()
  teamId: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  overrides?: Record<string, unknown>;
}
