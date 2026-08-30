import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Workspace display name', example: 'Circle Workspace' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @ApiPropertyOptional({
    description: 'Unique URL slug for workspace',
    example: 'circle-workspace',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must only contain lowercase alphanumeric characters and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Workspace icon/gradient identifier',
    example: 'from-orange-600 to-amber-500',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Workspace description',
    example: 'Engineering & Product workspace',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
