import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AgentChatDto {
  @ApiProperty({ example: 'Create a project to ship a command palette for the docs site' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
