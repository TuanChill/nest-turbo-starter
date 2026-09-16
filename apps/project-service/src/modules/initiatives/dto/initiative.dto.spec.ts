import { plainToInstance } from 'class-transformer';
import { CreateInitiativeUpdateDto, UpdateInitiativeUpdateDto } from './initiative.dto';

describe('initiative update DTO transformation', () => {
  const blocks = [{ type: 'paragraph', text: 'Simulation initiative update' }];

  it('preserves content blocks when creating an update', () => {
    const dto = plainToInstance(CreateInitiativeUpdateDto, {
      health: 'on-track',
      blocks,
    });

    expect(dto.blocks).toEqual(blocks);
  });

  it('preserves content blocks when editing an update', () => {
    const dto = plainToInstance(UpdateInitiativeUpdateDto, { blocks });

    expect(dto.blocks).toEqual(blocks);
  });
});
