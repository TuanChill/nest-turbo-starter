import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinWorkspaceDto {
  @ApiPropertyOptional({
    description: 'Workspace invite code (e.g. CIR-8F2A)',
    example: 'CIR-8F2A',
  })
  @IsString()
  @IsOptional()
  inviteCode?: string;

  @ApiPropertyOptional({
    description: 'Workspace slug (e.g. circle-workspace)',
    example: 'circle-workspace',
  })
  @IsString()
  @IsOptional()
  slug?: string;
}
