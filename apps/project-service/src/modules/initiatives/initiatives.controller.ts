import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateInitiativeDto, UpdateInitiativeDto } from './dto/initiative.dto';
import { InitiativesService } from './initiatives.service';

@ApiTags('Initiatives')
@Controller('initiatives')
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  @ApiOperation({ summary: 'Get all initiatives' })
  @Get()
  findAll() {
    return this.initiativesService.findAll();
  }

  @ApiOperation({ summary: 'Get initiative by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.initiativesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create initiative' })
  @Post()
  create(@Body() dto: CreateInitiativeDto) {
    return this.initiativesService.create(dto);
  }

  @ApiOperation({ summary: 'Update initiative' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInitiativeDto) {
    return this.initiativesService.update(id, dto);
  }
}
