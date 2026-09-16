import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

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

export class SnoozeNotificationDto {
  @ApiProperty({ nullable: true, example: '2026-09-18T09:00:00.000Z' })
  @IsISO8601()
  @IsOptional()
  until?: string | null;
}

export class NotificationCategoryPreferencesDto {
  @IsBoolean()
  @IsOptional()
  comments?: boolean;

  @IsBoolean()
  @IsOptional()
  mentions?: boolean;

  @IsBoolean()
  @IsOptional()
  assignments?: boolean;

  @IsBoolean()
  @IsOptional()
  statusChanges?: boolean;

  @IsBoolean()
  @IsOptional()
  projectUpdates?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  desktop?: boolean;

  @IsBoolean()
  @IsOptional()
  mobile?: boolean;

  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  slack?: boolean;

  @IsEnum(['digest', 'immediate'])
  @IsOptional()
  emailFormat?: 'digest' | 'immediate';

  @IsObject()
  @IsOptional()
  categories?: NotificationCategoryPreferencesDto;
}
