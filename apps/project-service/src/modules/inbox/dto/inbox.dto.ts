import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'LNUI-703' })
  @IsString()
  @IsNotEmpty()
  issueIdentifier: string;

  @ApiPropertyOptional({ example: 'ln' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: 'sophia' })
  @IsString()
  @IsNotEmpty()
  actorId: string;

  @ApiProperty({
    enum: [
      'comment',
      'mention',
      'assignment',
      'status',
      'reopened',
      'closed',
      'edited',
      'created',
      'upload',
    ],
  })
  @IsEnum([
    'comment',
    'mention',
    'assignment',
    'status',
    'reopened',
    'closed',
    'edited',
    'created',
    'upload',
  ])
  type:
    | 'comment'
    | 'mention'
    | 'assignment'
    | 'status'
    | 'reopened'
    | 'closed'
    | 'edited'
    | 'created'
    | 'upload';

  @ApiProperty({ example: 'Heads up: Radix solves this with a DismissableLayer tree.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}

export class MarkReadDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  read: boolean;
}
