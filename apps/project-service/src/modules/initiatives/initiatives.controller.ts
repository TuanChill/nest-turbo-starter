import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateInitiativeDto,
  CreateInitiativeUpdateDto,
  InitiativeUpdateReactionDto,
  UpdateInitiativeDto,
  UpdateInitiativeUpdateDto,
} from './dto/initiative.dto';
import { InitiativesService } from './initiatives.service';

@ApiTags('Initiatives')
@Controller('initiatives')
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  @ApiOperation({ summary: 'Get all initiatives' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @Get()
  findAll(@User('id') memberId: string, @Query('workspaceId') workspaceId?: string) {
    return this.initiativesService.findAll(memberId, workspaceId);
  }

  @ApiOperation({ summary: 'Get initiative by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.initiativesService.findOne(id, memberId);
  }

  @ApiOperation({ summary: 'Create initiative' })
  @Post()
  create(@Body() dto: CreateInitiativeDto, @User('id') memberId: string) {
    return this.initiativesService.create(dto, memberId);
  }

  @ApiOperation({ summary: 'Update initiative' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInitiativeDto,
    @User('id') memberId: string,
  ) {
    return this.initiativesService.update(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Post an initiative update' })
  @Post(':id/updates')
  addUpdate(
    @Param('id') id: string,
    @Body() dto: CreateInitiativeUpdateDto,
    @User('id') memberId: string,
  ) {
    return this.initiativesService.addUpdate(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Edit an initiative update created by the current member' })
  @Patch(':id/updates/:updateId')
  updateUpdate(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Body() dto: UpdateInitiativeUpdateDto,
    @User('id') memberId: string,
  ) {
    return this.initiativesService.updateUpdate(id, updateId, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete an initiative update created by the current member' })
  @Delete(':id/updates/:updateId')
  deleteUpdate(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @User('id') memberId: string,
  ) {
    return this.initiativesService.deleteUpdate(id, updateId, memberId);
  }

  @ApiOperation({ summary: 'Add a reaction to an initiative update' })
  @Post(':id/updates/:updateId/reactions')
  addUpdateReaction(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Body() dto: InitiativeUpdateReactionDto,
    @User('id') memberId: string,
  ) {
    return this.initiativesService.addUpdateReaction(id, updateId, dto.emoji, memberId);
  }

  @ApiOperation({
    summary: 'Remove the authenticated member reaction from an initiative update',
  })
  @Delete(':id/updates/:updateId/reactions/:emoji')
  removeUpdateReaction(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Param('emoji') emoji: string,
    @User('id') memberId: string,
  ) {
    return this.initiativesService.removeUpdateReaction(
      id,
      updateId,
      decodeURIComponent(emoji),
      memberId,
    );
  }

  @ApiOperation({ summary: 'Delete initiative' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.initiativesService.delete(id, memberId);
  }
}
