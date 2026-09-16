import {
  issueTemplateParentReferencesSameTeam,
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
      parentIssueId: undefined,
      milestone: undefined,
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
      parentIssueId: undefined,
      milestone: undefined,
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
      parentIssueId: ' ENG2-1 ',
      milestone: ' Beta ',
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
      parentIssueId: 'ENG2-1',
      milestone: 'Beta',
    });
  });

  it('rejects project and cycle defaults from different teams', () => {
    expect(issueTemplateReferencesSameTeam('team-a', 'team-b')).toBe(false);
    expect(issueTemplateReferencesSameTeam('team-a', 'team-a')).toBe(true);
    expect(issueTemplateReferencesSameTeam(undefined, 'team-a')).toBe(true);
  });

  it('requires a team template when a parent issue default is configured', () => {
    expect(issueTemplateParentReferencesSameTeam('team-a', undefined)).toBe(false);
    expect(issueTemplateParentReferencesSameTeam('team-a', 'team-b')).toBe(false);
    expect(issueTemplateParentReferencesSameTeam('team-a', 'team-a')).toBe(true);
    expect(issueTemplateParentReferencesSameTeam(undefined, undefined)).toBe(true);
  });
});
