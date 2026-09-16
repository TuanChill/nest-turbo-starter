import { BadRequestException } from '@nestjs/common';

export type AdvancedIssueFilter = {
  columnId: string;
  type: 'option' | 'multiOption' | 'text' | 'number' | 'date';
  operator: string;
  values: unknown[];
};

export type AdvancedIssueFilterNode =
  | AdvancedIssueFilter
  | {
      logic: 'and' | 'or';
      filters: AdvancedIssueFilterNode[];
    };

type IssueFilterRecord = {
  identifier?: string;
  title?: string;
  description?: string;
  statusId?: string;
  statusCategory?: string;
  priorityId?: string;
  assigneeId?: string;
  projectId?: string;
  cycleId?: string;
  rank?: string;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

const FILTER_TYPES = new Set(['option', 'multiOption', 'text', 'number', 'date']);
const FILTER_LOGIC = new Set(['and', 'or']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNode(value: unknown): AdvancedIssueFilterNode {
  if (!isRecord(value)) {
    throw new BadRequestException('Invalid advanced issue filter');
  }

  if ('logic' in value || 'filters' in value) {
    if (!FILTER_LOGIC.has(String(value.logic)) || !Array.isArray(value.filters)) {
      throw new BadRequestException('Invalid advanced issue filter group');
    }
    return {
      logic: value.logic as 'and' | 'or',
      filters: value.filters.map(normalizeNode),
    };
  }

  if (
    typeof value.columnId !== 'string' ||
    !FILTER_TYPES.has(String(value.type)) ||
    typeof value.operator !== 'string' ||
    !Array.isArray(value.values)
  ) {
    throw new BadRequestException('Invalid advanced issue filter condition');
  }

  return {
    columnId: value.columnId,
    type: value.type as AdvancedIssueFilter['type'],
    operator: value.operator,
    values: value.values,
  };
}

export function parseAdvancedIssueFilters(
  raw?: string | AdvancedIssueFilterNode[],
): AdvancedIssueFilterNode[] {
  if (raw === undefined || raw === '') return [];

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('Advanced issue filters must be valid JSON');
    }
  }

  if (!Array.isArray(parsed)) {
    throw new BadRequestException('Advanced issue filters must be an array');
  }
  return parsed.map(normalizeNode);
}

function optionValue(issue: IssueFilterRecord, columnId: string): string | undefined {
  switch (columnId) {
    case 'status':
      return issue.statusId;
    case 'statusType':
      return issue.statusCategory;
    case 'assignee':
      return issue.assigneeId ?? 'unassigned';
    case 'priority':
      return issue.priorityId;
    case 'project':
      return issue.projectId ?? '';
    case 'cycle':
      return issue.cycleId || 'no-cycle';
    default:
      return undefined;
  }
}

function textValue(issue: IssueFilterRecord, columnId: string): string | undefined {
  switch (columnId) {
    case 'identifier':
      return issue.identifier;
    case 'title':
      return issue.title;
    case 'description':
      return issue.description;
    case 'rank':
      return issue.rank;
    default:
      return undefined;
  }
}

function dateValue(issue: IssueFilterRecord, columnId: string): Date | undefined {
  switch (columnId) {
    case 'dueDate':
      return issue.dueDate;
    case 'createdAt':
      return issue.createdAt;
    case 'updatedAt':
      return issue.updatedAt;
    default:
      return undefined;
  }
}

function asStrings(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === 'string');
}

function matchesOption(value: string | undefined, filter: AdvancedIssueFilter): boolean {
  if (value === undefined) return false;
  const values = asStrings(filter.values).map((item) => item.toLowerCase());
  if (values.length === 0) return true;
  const found = values.includes(value.toLowerCase());
  switch (filter.operator) {
    case 'is':
    case 'is any of':
      return found;
    case 'is not':
    case 'is none of':
      return !found;
    default:
      return false;
  }
}

function matchesMultiOption(values: string[], filter: AdvancedIssueFilter): boolean {
  const filterValues = asStrings(filter.values);
  if (filterValues.length === 0) return true;
  const intersection = values.filter((value) => filterValues.includes(value));
  switch (filter.operator) {
    case 'include':
    case 'include any of':
      return intersection.length > 0;
    case 'exclude':
    case 'exclude if any of':
      return intersection.length === 0;
    case 'include all of':
      return intersection.length === filterValues.length;
    case 'exclude if all':
      return intersection.length !== filterValues.length;
    default:
      return false;
  }
}

function matchesText(value: string | undefined, filter: AdvancedIssueFilter): boolean {
  if (value === undefined) return false;
  const search = String(filter.values[0] ?? '')
    .trim()
    .toLowerCase();
  if (!search) return true;
  const found = value.toLowerCase().includes(search);
  if (filter.operator === 'contains') return found;
  if (filter.operator === 'does not contain') return !found;
  return false;
}

function matchesNumber(value: string | undefined, filter: AdvancedIssueFilter): boolean {
  if (value === undefined) return false;
  const number = Number(value);
  if (!Number.isFinite(number)) return false;
  const first = Number(filter.values[0]);
  const second = Number(filter.values[1]);
  if (!Number.isFinite(first)) return false;
  switch (filter.operator) {
    case 'is':
      return number === first;
    case 'is not':
      return number !== first;
    case 'is greater than':
      return number > first;
    case 'is greater than or equal to':
      return number >= first;
    case 'is less than':
      return number < first;
    case 'is less than or equal to':
      return number <= first;
    case 'is between':
      return Number.isFinite(second) && number >= first && number <= second;
    case 'is not between':
      return Number.isFinite(second) && (number < first || number > second);
    default:
      return false;
  }
}

function startOfUtcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function matchesDate(value: Date | undefined, filter: AdvancedIssueFilter): boolean {
  if (!value) return false;
  const first = new Date(String(filter.values[0] ?? ''));
  const second = new Date(String(filter.values[1] ?? ''));
  if (Number.isNaN(first.getTime())) return false;
  const current = value.getTime();
  const firstDay = startOfUtcDay(first);
  const secondDay = Number.isNaN(second.getTime()) ? firstDay : startOfUtcDay(second);
  switch (filter.operator) {
    case 'is':
      return startOfUtcDay(value) === firstDay;
    case 'is not':
      return startOfUtcDay(value) !== firstDay;
    case 'is before':
      return current < firstDay;
    case 'is on or after':
      return current >= firstDay;
    case 'is after':
      return current >= firstDay + 24 * 60 * 60 * 1000;
    case 'is on or before':
      return current < firstDay + 24 * 60 * 60 * 1000;
    case 'is between':
      return current >= firstDay && current < secondDay + 24 * 60 * 60 * 1000;
    case 'is not between':
      return current < firstDay || current >= secondDay + 24 * 60 * 60 * 1000;
    default:
      return false;
  }
}

function matchesCondition(
  issue: IssueFilterRecord,
  labelIds: string[],
  filter: AdvancedIssueFilter,
): boolean {
  if (filter.type === 'option')
    return matchesOption(optionValue(issue, filter.columnId), filter);
  if (filter.type === 'multiOption') {
    if (filter.columnId !== 'labels') return false;
    return matchesMultiOption(labelIds, filter);
  }
  if (filter.type === 'text')
    return matchesText(textValue(issue, filter.columnId), filter);
  if (filter.type === 'number')
    return matchesNumber(textValue(issue, filter.columnId), filter);
  if (filter.type === 'date')
    return matchesDate(dateValue(issue, filter.columnId), filter);
  return false;
}

export function matchesAdvancedIssueFilters(
  issue: IssueFilterRecord,
  labelIds: string[],
  filters: AdvancedIssueFilterNode[],
): boolean {
  return filters.every((filter) => {
    if ('logic' in filter) {
      const matches = filter.filters.map((child) =>
        'logic' in child
          ? matchesAdvancedIssueFilters(issue, labelIds, [child])
          : matchesCondition(issue, labelIds, child),
      );
      return filter.logic === 'or' ? matches.some(Boolean) : matches.every(Boolean);
    }
    return matchesCondition(issue, labelIds, filter);
  });
}
