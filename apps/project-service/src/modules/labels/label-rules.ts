import { BadRequestException } from '@nestjs/common';

type LabelLike = { groupId?: string };
type LabelGroupLike = { id: string; name: string; mutuallyExclusive: boolean };

/**
 * Linear label groups can be mutually exclusive. Keep this rule independent of
 * HTTP and persistence so issue/project mutations enforce the same contract.
 */
export function assertMutuallyExclusiveLabelSelection(
  labels: Array<LabelLike | undefined>,
  groups: LabelGroupLike[],
) {
  const counts = new Map<string, number>();
  for (const label of labels) {
    if (label?.groupId) counts.set(label.groupId, (counts.get(label.groupId) ?? 0) + 1);
  }
  const invalidGroup = groups.find(
    (group) => group.mutuallyExclusive && (counts.get(group.id) ?? 0) > 1,
  );
  if (invalidGroup) {
    throw new BadRequestException(
      `Only one label from the mutually exclusive group "${invalidGroup.name}" can be applied`,
    );
  }
}
