import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCycleDto {
  @ApiPropertyOptional({ example: '24' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 24 })
  @IsNumber()
  @IsNotEmpty()
  number: number;

  @ApiProperty({ example: 'Cycle 24' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CORE' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({ enum: ['planned', 'upcoming', 'current', 'completed'], default: 'planned' })
  @IsEnum(['planned', 'upcoming', 'current', 'completed'])
  status: 'planned' | 'upcoming' | 'current' | 'completed';

  @ApiProperty({ example: '2026-09-01' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-09-14' })
  @IsString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  capacity?: number;
}

export class UpdateCycleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['planned', 'upcoming', 'current', 'completed'] })
  @IsEnum(['planned', 'upcoming', 'current', 'completed'])
  @IsOptional()
  status?: 'planned' | 'upcoming' | 'current' | 'completed';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  capacity?: number;
}
