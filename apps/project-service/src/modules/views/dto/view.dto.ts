import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateViewDto {
  @ApiPropertyOptional({ example: 'blocked-3-days' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: '+ 3 days blocked issues' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Issues that are Blocked or Paused for more than 3 days' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '🧊' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ enum: ['issue', 'project'], default: 'issue' })
  @IsEnum(['issue', 'project'])
  type: 'issue' | 'project';

  @ApiPropertyOptional({ example: 'CORE' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ example: 'ln' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ type: Object, example: { statusIds: ['blocked', 'paused'] } })
  @IsObject()
  @IsOptional()
  filter?: any;
}

export class UpdateViewDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: ['issue', 'project'] })
  @IsEnum(['issue', 'project'])
  @IsOptional()
  type?: 'issue' | 'project';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  filter?: any;
}
