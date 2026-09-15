import { normalizeIssueTemplateConfig } from './issue-template-config';

describe('normalizeIssueTemplateConfig', () => {
  it('trims titles and removes duplicate label ids', () => {
    expect(
      normalizeIssueTemplateConfig({
        title: '  Bug report  ',
        labelIds: ['bug', 'bug', 'ui'],
        descriptionBlocks: 'invalid' as any,
      }),
    ).toEqual({
      title: 'Bug report',
      description: undefined,
      descriptionBlocks: undefined,
      statusId: undefined,
      statusCategory: undefined,
      priorityId: undefined,
      assigneeId: undefined,
      labelIds: ['bug', 'ui'],
      projectId: undefined,
      cycleId: undefined,
      dueDate: undefined,
    });
  });

  it('returns an empty normalized config when no config is provided', () => {
    expect(normalizeIssueTemplateConfig()).toEqual({
      title: undefined,
      description: undefined,
      descriptionBlocks: undefined,
      statusId: undefined,
      statusCategory: undefined,
      priorityId: undefined,
      assigneeId: undefined,
      labelIds: undefined,
      projectId: undefined,
      cycleId: undefined,
      dueDate: undefined,
    });
  });
});
