import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateUploadDto {
  @ApiProperty({ example: 'design.png' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ example: 102400 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  fileSize: number;

  @ApiPropertyOptional({ example: 'ENG2-1' })
  @IsString()
  @IsOptional()
  issueIdentifier?: string;

  @ApiPropertyOptional({ example: 'project-1' })
  @IsString()
  @IsOptional()
  projectId?: string;
}
