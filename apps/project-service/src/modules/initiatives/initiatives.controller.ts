import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateInitiativeDto,
  CreateInitiativeUpdateDto,
  UpdateInitiativeDto,
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

  @ApiOperation({ summary: 'Delete initiative' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.initiativesService.delete(id, memberId);
  }
}
