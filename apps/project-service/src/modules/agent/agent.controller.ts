import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { AgentChatDto } from './dto/agent.dto';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @ApiOperation({ summary: 'Chat with AI workspace agent' })
  @Post('chat')
  chat(@Body() dto: AgentChatDto) {
    return this.agentService.chat(dto);
  }

  @ApiOperation({ summary: 'Get agent example prompts' })
  @Get('examples')
  getExamples() {
    return this.agentService.getExamples();
  }
}
