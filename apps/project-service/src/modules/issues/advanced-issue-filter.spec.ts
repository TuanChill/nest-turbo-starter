import { BadRequestException } from '@nestjs/common';
import {
  matchesAdvancedIssueFilters,
  parseAdvancedIssueFilters,
} from './advanced-issue-filter';

describe('advanced issue filters', () => {
  const issue = {
    id: 'issue-1',
    identifier: 'ENG-1',
    title: 'Fix the API timeout',
    description: 'Investigate the slow request path',
    statusId: 'in-progress',
    statusCategory: 'started',
    priorityId: 'high',
    assigneeId: 'member-1',
    projectId: 'project-1',
    cycleId: 'cycle-1',
    rank: '0|hzzzzz:',
    dueDate: new Date('2026-09-20T10:00:00.000Z'),
    createdAt: new Date('2026-09-10T10:00:00.000Z'),
    updatedAt: new Date('2026-09-16T10:00:00.000Z'),
  };

  it('supports option, text, date, and multi-option conditions together', () => {
    const filters = parseAdvancedIssueFilters(
      JSON.stringify([
        { columnId: 'status', type: 'option', operator: 'is', values: ['in-progress'] },
        { columnId: 'title', type: 'text', operator: 'contains', values: ['api'] },
        {
          columnId: 'labels',
          type: 'multiOption',
          operator: 'include all of',
          values: ['bug', 'backend'],
        },
        {
          columnId: 'dueDate',
          type: 'date',
          operator: 'is between',
          values: ['2026-09-20', '2026-09-21'],
        },
      ]),
    );

    expect(matchesAdvancedIssueFilters(issue, ['bug', 'backend'], filters)).toBe(true);
    expect(matchesAdvancedIssueFilters(issue, ['bug'], filters)).toBe(false);
  });

  it('supports nested AND/OR groups and negated operators', () => {
    const filters = parseAdvancedIssueFilters([
      {
        logic: 'and',
        filters: [
          {
            logic: 'or',
            filters: [
              {
                columnId: 'priority',
                type: 'option',
                operator: 'is',
                values: ['urgent'],
              },
              { columnId: 'priority', type: 'option', operator: 'is', values: ['high'] },
            ],
          },
          {
            columnId: 'assignee',
            type: 'option',
            operator: 'is not',
            values: ['unassigned'],
          },
        ],
      },
    ]);

    expect(matchesAdvancedIssueFilters(issue, [], filters)).toBe(true);
    expect(
      matchesAdvancedIssueFilters(
        { ...issue, priorityId: 'low', assigneeId: undefined },
        [],
        filters,
      ),
    ).toBe(false);
  });

  it('rejects malformed or unsupported filter payloads', () => {
    expect(() => parseAdvancedIssueFilters('{bad json')).toThrow(BadRequestException);
    expect(() => parseAdvancedIssueFilters([{ columnId: 'status' } as never])).toThrow(
      BadRequestException,
    );
    expect(
      matchesAdvancedIssueFilters(
        issue,
        [],
        [{ columnId: 'unknown', type: 'option', operator: 'is', values: ['x'] }],
      ),
    ).toBe(false);
  });
});
