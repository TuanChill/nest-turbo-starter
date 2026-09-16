import {
  issueTemplateReferencesSameTeam,
  normalizeIssueTemplateConfig,
} from './issue-template-config';

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

  it('preserves all persisted issue property defaults', () => {
    const config = normalizeIssueTemplateConfig({
      title: 'Bug',
      description: '**Details**',
      descriptionBlocks: [{ type: 'paragraph', text: 'Details' }],
      statusId: 'in-progress',
      statusCategory: 'started',
      priorityId: 'high',
      assigneeId: 'member-1',
      labelIds: ['bug'],
      projectId: 'project-1',
      cycleId: 'cycle-1',
      dueDate: '2026-09-30',
    });

    expect(config).toMatchObject({
      title: 'Bug',
      description: '**Details**',
      descriptionBlocks: [{ type: 'paragraph', text: 'Details' }],
      statusId: 'in-progress',
      statusCategory: 'started',
      priorityId: 'high',
      assigneeId: 'member-1',
      labelIds: ['bug'],
      projectId: 'project-1',
      cycleId: 'cycle-1',
      dueDate: '2026-09-30',
    });
  });

  it('rejects project and cycle defaults from different teams', () => {
    expect(issueTemplateReferencesSameTeam('team-a', 'team-b')).toBe(false);
    expect(issueTemplateReferencesSameTeam('team-a', 'team-a')).toBe(true);
    expect(issueTemplateReferencesSameTeam(undefined, 'team-a')).toBe(true);
  });
});
