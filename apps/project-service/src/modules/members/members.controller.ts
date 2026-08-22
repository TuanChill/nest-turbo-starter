import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiOperation({ summary: 'Get all workspace members' })
  @Get()
  findAll(): Promise<any[]> {
    return this.membersService.findAll();
  }

  @ApiOperation({ summary: 'Get workspace member by ID' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.membersService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new member' })
  @Post()
  create(@Body() dto: CreateMemberDto): Promise<any> {
    return this.membersService.create(dto);
  }

  @ApiOperation({ summary: 'Update member' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto): Promise<any> {
    return this.membersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Get teams of a member' })
  @Get(':id/teams')
  getTeams(@Param('id') id: string): Promise<any[]> {
    return this.membersService.getMemberTeams(id);
  }
}
