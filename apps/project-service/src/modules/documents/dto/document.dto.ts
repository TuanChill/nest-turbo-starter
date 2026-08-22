import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFolderDto {
  @ApiPropertyOptional({ example: 'team-documents' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Team documents' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '📁' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'CORE' })
  @IsString()
  @IsOptional()
  teamId?: string;
}

export class CreateDocumentDto {
  @ApiPropertyOptional({ example: 'doc-1' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'team-documents' })
  @IsString()
  @IsNotEmpty()
  folderId: string;

  @ApiProperty({ example: 'LNDev UI Team Calendar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '📆' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'ln' })
  @IsString()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;
}
