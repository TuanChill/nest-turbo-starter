import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
