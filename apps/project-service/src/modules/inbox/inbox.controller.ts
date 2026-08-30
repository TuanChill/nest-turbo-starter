import { User } from '@app/common';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDto, MarkReadDto } from './dto/inbox.dto';
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

  @ApiOperation({ summary: 'Create new notification' })
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.inboxService.create(dto);
  }
}
