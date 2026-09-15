import { NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentService } from './agent.service';

describe('AgentService', () => {
  it('does not expose canned agent behavior in production', async () => {
    const config = {
      get: jest.fn().mockReturnValue('production'),
    } as unknown as ConfigService;
    const service = new AgentService(config);

    await expect(service.chat({ message: 'Summarize my issues' })).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it('does not expose canned example prompts in production', () => {
    const config = {
      get: jest.fn().mockReturnValue('production'),
    } as unknown as ConfigService;
    const service = new AgentService(config);

    expect(() => service.getExamples()).toThrow(NotImplementedException);
  });
});
