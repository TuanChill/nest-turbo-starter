import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateCycleDto, UpdateCycleDto } from './dto/cycle.dto';
import { CyclesService } from './cycles.service';

@ApiTags('Cycles')
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @ApiOperation({ summary: 'Get all cycles' })
  @ApiQuery({ name: 'teamId', required: false })
  @Get()
  findAll(@Query('teamId') teamId?: string) {
    return this.cyclesService.findAll(teamId);
  }

  @ApiOperation({ summary: 'Get cycle by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cyclesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create cycle' })
  @Post()
  create(@Body() dto: CreateCycleDto) {
    return this.cyclesService.create(dto);
  }

  @ApiOperation({ summary: 'Update cycle' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCycleDto) {
    return this.cyclesService.update(id, dto);
  }
}
