import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIssueDto {
  @ApiPropertyOptional({ example: 'LNUI-701' })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({
    example: 'Combobox: keyboard selection skips disabled options inconsistently',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  descriptionBlocks?: any[];

  @ApiPropertyOptional({ default: 'to-do' })
  @IsString()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional({ default: 'unstarted' })
  @IsString()
  @IsOptional()
  statusCategory?: string;

  @ApiPropertyOptional({ default: 'no-priority' })
  @IsString()
  @IsOptional()
  priorityId?: string;

  @ApiPropertyOptional({ example: 'mason' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 'CORE' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: '21' })
  @IsString()
  @IsOptional()
  cycleId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentIssueId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  labelIds?: string[];

  @ApiPropertyOptional({ example: '0|hzzzzz:' })
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiPropertyOptional({ example: '2026-08-30' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  milestone?: string;
}

export class UpdateIssueDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  descriptionBlocks?: any[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  statusCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priorityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cycleId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentIssueId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  labelIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  milestone?: string;
}

export class UpdateIssueRankDto {
  @ApiProperty({ example: '0|hzzzzz:' })
  @IsString()
  @IsNotEmpty()
  rank: string;
}

export class CreateCommentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  textContent?: string;

  @ApiPropertyOptional({ type: Array })
  @IsArray()
  @IsOptional()
  @Type(() => Object)
  commentBlocks?: any[];
}

export class AddReactionDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}

export class AddRelationDto {
  @ApiProperty({ example: 'LNUI-707' })
  @IsString()
  @IsNotEmpty()
  targetIdentifier: string;

  @ApiProperty({ enum: ['blocks', 'blocked_by', 'relates_to', 'duplicate_of'] })
  @IsEnum(['blocks', 'blocked_by', 'relates_to', 'duplicate_of'])
  relationType: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of';
}
