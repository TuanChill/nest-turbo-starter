import { Public, User } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CyclesService } from './cycles.service';
import { CreateCycleDto, UpdateCycleDto, UpdateCycleSettingsDto } from './dto/cycle.dto';

@ApiTags('Cycles')
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @ApiOperation({ summary: 'Get all cycles' })
  @ApiQuery({ name: 'teamId', required: false })
  @Get()
  findAll(@User('id') memberId: string, @Query('teamId') teamId?: string) {
    return this.cyclesService.findAll(memberId, teamId);
  }

  @ApiOperation({ summary: 'Get persisted team cycle settings' })
  @Get('settings')
  settings(@Query('teamId') teamId: string, @User('id') memberId: string) {
    return this.cyclesService.getSettings(teamId, memberId);
  }

  @ApiOperation({ summary: 'Update team cycle settings' })
  @Patch('settings')
  updateSettings(
    @Query('teamId') teamId: string,
    @Body() dto: UpdateCycleSettingsDto,
    @User('id') memberId: string,
  ) {
    return this.cyclesService.updateSettings(teamId, dto, memberId);
  }

  @ApiOperation({ summary: 'Get the authenticated member cycle calendar subscription' })
  @Get('calendar-subscription')
  calendarSubscription(@Query('teamId') teamId: string, @User('id') memberId: string) {
    return this.cyclesService.getCalendarSubscription(teamId, memberId);
  }

  @ApiOperation({ summary: 'Create or rotate a cycle calendar subscription' })
  @Post('calendar-subscription')
  subscribeCalendar(@Query('teamId') teamId: string, @User('id') memberId: string) {
    return this.cyclesService.subscribeCalendar(teamId, memberId);
  }

  @ApiOperation({ summary: 'Revoke a cycle calendar subscription' })
  @Delete('calendar-subscription')
  unsubscribeCalendar(@Query('teamId') teamId: string, @User('id') memberId: string) {
    return this.cyclesService.unsubscribeCalendar(teamId, memberId);
  }

  @Public()
  @ApiOperation({ summary: 'Public tokenized cycle calendar feed' })
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'private, max-age=300')
  @Get('calendar/:token.ics')
  calendarFeed(@Param('token') token: string) {
    return this.cyclesService.calendarFeed(token);
  }

  @ApiOperation({ summary: 'Get cycle by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.cyclesService.findOne(id, memberId);
  }

  @ApiOperation({ summary: 'Start an upcoming cycle today' })
  @Post(':id/start-today')
  startToday(@Param('id') id: string, @User('id') memberId: string) {
    return this.cyclesService.startToday(id, memberId);
  }

  @ApiOperation({ summary: 'Get persisted historical cycle progress' })
  @Get(':id/history')
  history(@Param('id') id: string, @User('id') memberId: string) {
    return this.cyclesService.history(id, memberId);
  }

  @ApiOperation({ summary: 'Create cycle' })
  @Post()
  create(@Body() dto: CreateCycleDto, @User('id') memberId: string) {
    return this.cyclesService.create(dto, memberId);
  }

  @ApiOperation({ summary: 'Update cycle' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCycleDto,
    @User('id') memberId: string,
  ) {
    return this.cyclesService.update(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete cycle' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.cyclesService.delete(id, memberId);
  }
}
