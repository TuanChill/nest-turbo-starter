import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinWorkspaceDto {
  @ApiPropertyOptional({
    description: 'Single-use invitation token from an invitation email',
  })
  @IsString()
  @IsOptional()
  invitationToken?: string;

  @ApiPropertyOptional({
    description: 'Workspace invite code (e.g. CIR-8F2A)',
    example: 'CIR-8F2A',
  })
  @IsString()
  @IsOptional()
  inviteCode?: string;
}
