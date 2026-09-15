import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateNotificationDto,
  MarkReadDto,
  UpdateNotificationPreferencesDto,
} from './dto/inbox.dto';
import { InboxService } from './inbox.service';

@ApiTags('Inbox')
@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @ApiOperation({ summary: 'Get all notifications / inbox items' })
  @Get()
  findAll(@User('id') userId: string) {
    return this.inboxService.findAll(userId);
  }

  @ApiOperation({ summary: 'Get persisted notification preferences' })
  @Get('preferences')
  getPreferences(@User('id') userId: string) {
    return this.inboxService.getNotificationPreferences(userId);
  }

  @ApiOperation({ summary: 'Update persisted notification preferences' })
  @Patch('preferences')
  updatePreferences(
    @User('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.inboxService.updateNotificationPreferences(userId, dto);
  }

  @ApiOperation({ summary: 'Mark single notification as read/unread' })
  @Patch(':id/read')
  markAsRead(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.inboxService.markAsRead(userId, id, dto);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Post('read-all')
  markAllAsRead(@User('id') userId: string) {
    return this.inboxService.markAllAsRead(userId);
  }

  @ApiOperation({ summary: 'Delete all notifications' })
  @Delete()
  deleteAll(@User('id') userId: string) {
    return this.inboxService.deleteAll(userId);
  }

  @ApiOperation({ summary: 'Delete read notifications' })
  @Delete('read')
  deleteRead(@User('id') userId: string) {
    return this.inboxService.deleteRead(userId);
  }

  @ApiOperation({ summary: 'Delete notifications for completed issues' })
  @Delete('completed-issues')
  deleteForCompletedIssues(@User('id') userId: string) {
    return this.inboxService.deleteForCompletedIssues(userId);
  }

  @ApiOperation({ summary: 'Delete one notification' })
  @Delete(':id')
  delete(@User('id') userId: string, @Param('id') id: string) {
    return this.inboxService.delete(userId, id);
  }

  @ApiOperation({ summary: 'Create new notification' })
  @Post()
  create(@Body() dto: CreateNotificationDto, @User('id') actorId: string) {
    return this.inboxService.create(dto, actorId);
  }
}
