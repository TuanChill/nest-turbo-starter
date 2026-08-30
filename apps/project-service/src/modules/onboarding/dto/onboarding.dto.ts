import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class OnboardingCompleteDto {
  @ApiProperty({ description: 'Workspace display name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  workspaceName: string;

  @ApiPropertyOptional({ description: 'Workspace URL slug', example: 'acme-corp' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Workspace slug must only contain lowercase alphanumeric characters and hyphens',
  })
  workspaceSlug?: string;

  @ApiPropertyOptional({
    description: 'Workspace icon/gradient identifier',
    example: 'from-orange-600 to-amber-500',
  })
  @IsString()
  @IsOptional()
  workspaceIcon?: string;

  @ApiProperty({ description: 'First Team display name', example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  teamName: string;

  @ApiProperty({
    description: 'Team identifier Key (2-5 uppercase letters)',
    example: 'ENG',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 6)
  teamKey: string;

  @ApiPropertyOptional({ description: 'Team emoji or icon', example: '⚡' })
  @IsString()
  @IsOptional()
  teamIcon?: string;

  @ApiPropertyOptional({ description: 'Team theme color', example: '#5e6ad2' })
  @IsString()
  @IsOptional()
  teamColor?: string;

  @ApiPropertyOptional({
    description: 'List of email addresses to invite',
    example: ['colleague@example.com'],
  })
  @IsArray()
  @IsOptional()
  inviteEmails?: string[];
}
