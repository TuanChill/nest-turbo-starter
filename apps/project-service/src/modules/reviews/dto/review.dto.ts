import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiPropertyOptional({ example: 'rev-101' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'fix: rework Dialog focus trap for nested portals' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ['open', 'merged', 'closed'], default: 'open' })
  @IsEnum(['open', 'merged', 'closed'])
  status: 'open' | 'merged' | 'closed';

  @ApiPropertyOptional({ example: 'LNUI-703' })
  @IsString()
  @IsOptional()
  resolves?: string;

  @ApiPropertyOptional({ example: 'feat/dialog-nested-portals' })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  fileStats?: any[];

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  commits?: any[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  summaryBullets?: string[];

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  verdicts?: any[];

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  guideSections?: any[];

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  fileDiffs?: any[];
}

export class UpdateReviewDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ enum: ['open', 'merged', 'closed'] })
  @IsEnum(['open', 'merged', 'closed'])
  @IsOptional()
  status?: 'open' | 'merged' | 'closed';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resolves?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branch?: string;
}
