import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { IssueTemplateConfig, IssueTemplateScope } from '../../../data-access';

export class CreateIssueTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['workspace', 'team'] })
  @IsEnum(['workspace', 'team'])
  scope: IssueTemplateScope;

  @ApiProperty()
  @IsString()
  workspaceId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ type: Object })
  @IsObject()
  config: IssueTemplateConfig;
}

export class UpdateIssueTemplateDto {
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
  scope?: IssueTemplateScope;

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
  config?: IssueTemplateConfig;
}
