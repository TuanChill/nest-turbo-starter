import { BadRequestException } from '@nestjs/common';
import { assertMutuallyExclusiveLabelSelection } from './label-rules';

describe('assertMutuallyExclusiveLabelSelection', () => {
  const group = { id: 'priority', name: 'Priority', mutuallyExclusive: true };

  it('rejects two labels in a mutually exclusive group', () => {
    expect(() =>
      assertMutuallyExclusiveLabelSelection(
        [{ groupId: group.id }, { groupId: group.id }],
        [group],
      ),
    ).toThrow(BadRequestException);
  });

  it('allows labels from different groups and non-exclusive groups', () => {
    expect(() =>
      assertMutuallyExclusiveLabelSelection(
        [{ groupId: 'type' }, { groupId: group.id }],
        [group, { id: 'type', name: 'Type', mutuallyExclusive: false }],
      ),
    ).not.toThrow();
  });
});
