import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Max, Min } from 'class-validator';

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

  @ApiProperty({
    enum: ['planned', 'upcoming', 'current', 'completed'],
    default: 'planned',
  })
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

export class UpdateCycleSettingsDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, default: 2 })
  @IsInt()
  @Min(1)
  @Max(8)
  @IsOptional()
  durationWeeks?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 6, default: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  startDayOfWeek?: number;

  @ApiPropertyOptional({
    example: 'UTC',
    description: 'IANA timezone used for cycle calendar days',
  })
  @IsString()
  @IsOptional()
  timeZone?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 30, default: 0 })
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  cooldownDays?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 15, default: 3 })
  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  upcomingCycleCount?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  autoAddActiveIssues?: boolean;
}
