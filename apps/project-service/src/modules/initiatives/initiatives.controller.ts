import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateInitiativeDto, UpdateInitiativeDto } from './dto/initiative.dto';
import { InitiativesService } from './initiatives.service';

@ApiTags('Initiatives')
@Controller('initiatives')
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  @ApiOperation({ summary: 'Get all initiatives' })
  @Get()
  findAll(@User('id') memberId: string) {
    return this.initiativesService.findAll(memberId);
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

  @ApiOperation({ summary: 'Delete initiative' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.initiativesService.delete(id, memberId);
  }
}
