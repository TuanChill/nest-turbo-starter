import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDto, MarkReadDto } from './dto/inbox.dto';
import { InboxService } from './inbox.service';

@ApiTags('Inbox')
@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @ApiOperation({ summary: 'Get all notifications / inbox items' })
  @ApiQuery({ name: 'userId', required: false })
  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.inboxService.findAll(userId || 'ln');
  }

  @ApiOperation({ summary: 'Mark single notification as read/unread' })
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Body() dto: MarkReadDto) {
    return this.inboxService.markAsRead(id, dto);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Post('read-all')
  markAllAsRead(@Query('userId') userId?: string) {
    return this.inboxService.markAllAsRead(userId || 'ln');
  }

  @ApiOperation({ summary: 'Create new notification' })
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.inboxService.create(dto);
  }
}
