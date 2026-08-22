import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { v7 } from 'uuid';
import {
  Issue,
  IssueActivity,
  IssueLabel,
  IssueRelation,
  Label,
  Member,
  PrLink,
  Project,
} from '../../data-access';
import {
  AddReactionDto,
  AddRelationDto,
  CreateCommentDto,
  CreateIssueDto,
  UpdateIssueDto,
} from './dto/issue.dto';

const ALL_STATUSES: Record<
  string,
  { id: string; name: string; color: string; category: string }
> = {
  idea: { id: 'idea', name: 'Idea', color: '#bec2c8', category: 'triage' },
  backlog: { id: 'backlog', name: 'Backlog', color: '#bec2c8', category: 'backlog' },
  triage: { id: 'triage', name: 'Triage', color: '#f2994a', category: 'triage' },
  'to-do': { id: 'to-do', name: 'To Do', color: '#e2e2e2', category: 'unstarted' },
  'in-progress': { id: 'in-progress', name: 'In Progress', color: '#f2c94c', category: 'started' },
  done: { id: 'done', name: 'Done', color: '#5e6ad2', category: 'completed' },
  canceled: { id: 'canceled', name: 'Canceled', color: '#95a2b3', category: 'canceled' },
  duplicate: { id: 'duplicate', name: 'Duplicate', color: '#6b7280', category: 'canceled' },
  paused: { id: 'paused', name: 'Paused', color: '#8f9299', category: 'unstarted' },
  'in-review': { id: 'in-review', name: 'In Review', color: '#26b5ce', category: 'started' },
  'technical-review': {
    id: 'technical-review',
    name: 'Technical Review',
    color: '#9b51e0',
    category: 'started',
  },
  'product-feedback': {
    id: 'product-feedback',
    name: 'Product Feedback',
    color: '#eb5757',
    category: 'started',
  },
  shipped: { id: 'shipped', name: 'Shipped', color: '#27ae60', category: 'completed' },
};

const ALL_PRIORITIES: Record<string, { id: string; name: string }> = {
  'no-priority': { id: 'no-priority', name: 'No priority' },
  urgent: { id: 'urgent', name: 'Urgent' },
  high: { id: 'high', name: 'High' },
  medium: { id: 'medium', name: 'Medium' },
  low: { id: 'low', name: 'Low' },
};

@Injectable()
export class IssuesService {
  constructor(private readonly em: EntityManager) {}

  private transformIssue(
    issue: Issue,
    membersMap: Map<string, any>,
    labelsMap: Map<string, any>,
    projectsMap: Map<string, any>,
    issueLabels: IssueLabel[],
    subissuesMap: Map<string, string[]>,
  ) {
    const assignee = issue.assigneeId ? membersMap.get(issue.assigneeId) ?? null : null;
    const labelIds = issueLabels
      .filter((il) => il.issueId === issue.id || il.issueId === issue.identifier)
      .map((il) => il.labelId);
    const labels = labelIds.map((lid) => labelsMap.get(lid)).filter(Boolean);

    const project = issue.projectId ? projectsMap.get(issue.projectId) : undefined;
    const subissues = subissuesMap.get(issue.id) || subissuesMap.get(issue.identifier) || [];

    const status = ALL_STATUSES[issue.statusId] || {
      id: issue.statusId,
      name: issue.statusId,
      color: '#e2e2e2',
      category: issue.statusCategory || 'unstarted',
    };

    const priority = ALL_PRIORITIES[issue.priorityId] || ALL_PRIORITIES['no-priority'];

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || '',
      status,
      assignee,
      priority,
      labels,
      createdAt: issue.createdAt ? issue.createdAt.toISOString().split('T')[0] : '2026-07-01',
      cycleId: issue.cycleId ?? '',
      project,
      subissues: subissues.length > 0 ? subissues : undefined,
      rank: issue.rank || '0|hzzzzz:',
      dueDate: issue.dueDate ? issue.dueDate.toISOString().split('T')[0] : undefined,
    };
  }

  async findAll(query?: {
    teamId?: string;
    cycleId?: string;
    projectId?: string;
    statusCategories?: string | string[];
    statusIds?: string | string[];
    priorityIds?: string | string[];
    assigneeId?: string;
    labelIds?: string | string[];
    search?: string;
  }) {
    const where: any = {};

    if (query?.teamId) where.teamId = query.teamId;
    if (query?.cycleId !== undefined) where.cycleId = query.cycleId;
    if (query?.projectId) where.projectId = query.projectId;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;

    if (query?.statusCategories) {
      const cats = Array.isArray(query.statusCategories)
        ? query.statusCategories
        : query.statusCategories.split(',');
      where.statusCategory = { $in: cats };
    }

    if (query?.statusIds) {
      const sids = Array.isArray(query.statusIds)
        ? query.statusIds
        : query.statusIds.split(',');
      where.statusId = { $in: sids };
    }

    if (query?.priorityIds) {
      const pids = Array.isArray(query.priorityIds)
        ? query.priorityIds
        : query.priorityIds.split(',');
      where.priorityId = { $in: pids };
    }

    if (query?.search) {
      where.$or = [
        { title: { $ilike: `%${query.search}%` } },
        { identifier: { $ilike: `%${query.search}%` } },
        { description: { $ilike: `%${query.search}%` } },
      ];
    }

    const issues = await this.em.find(Issue, where, {
      orderBy: { rank: 'ASC', createdAt: 'DESC' },
    });

    const members = await this.em.find(Member, {});
    const labels = await this.em.find(Label, {});
    const projects = await this.em.find(Project, {});
    const issueLabels = await this.em.find(IssueLabel, {});

    const membersMap = new Map(members.map((m) => [m.id, m]));
    const labelsMap = new Map(labels.map((l) => [l.id, l]));
    const projectsMap = new Map(projects.map((p) => [p.id, p]));

    // subissues mapping
    const subissuesMap = new Map<string, string[]>();
    for (const issue of issues) {
      if (issue.parentIssueId) {
        const list = subissuesMap.get(issue.parentIssueId) || [];
        list.push(issue.identifier);
        subissuesMap.set(issue.parentIssueId, list);
      }
    }

    // Filter by labelIds if provided
    let results = issues;
    if (query?.labelIds) {
      const filterLabelIds = Array.isArray(query.labelIds)
        ? query.labelIds
        : query.labelIds.split(',');
      const issueIdsWithLabels = new Set(
        issueLabels
          .filter((il) => filterLabelIds.includes(il.labelId))
          .map((il) => il.issueId),
      );
      results = results.filter(
        (i) => issueIdsWithLabels.has(i.id) || issueIdsWithLabels.has(i.identifier),
      );
    }

    return results.map((issue) =>
      this.transformIssue(
        issue,
        membersMap,
        labelsMap,
        projectsMap,
        issueLabels,
        subissuesMap,
      ),
    );
  }

  async findOne(identifierOrId: string) {
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (!issue) throw new NotFoundException(`Issue ${identifierOrId} not found`);

    const members = await this.em.find(Member, {});
    const labels = await this.em.find(Label, {});
    const projects = await this.em.find(Project, {});
    const issueLabels = await this.em.find(IssueLabel, {
      $or: [{ issueId: issue.id }, { issueId: issue.identifier }],
    });

    const membersMap = new Map(members.map((m) => [m.id, m]));
    const labelsMap = new Map(labels.map((l) => [l.id, l]));
    const projectsMap = new Map(projects.map((p) => [p.id, p]));

    const subIssues = await this.em.find(Issue, {
      $or: [{ parentIssueId: issue.id }, { parentIssueId: issue.identifier }],
    });
    const subissuesMap = new Map<string, string[]>();
    if (subIssues.length > 0) {
      const identifiers = subIssues.map((s) => s.identifier);
      subissuesMap.set(issue.id, identifiers);
      subissuesMap.set(issue.identifier, identifiers);
    }

    return this.transformIssue(
      issue,
      membersMap,
      labelsMap,
      projectsMap,
      issueLabels,
      subissuesMap,
    );
  }

  async findDetail(identifierOrId: string) {
    const base = await this.findOne(identifierOrId);
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (!issue) throw new NotFoundException(`Issue ${identifierOrId} not found`);

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, m]));

    const activities = await this.em.find(
      IssueActivity,
      { issueIdentifier: issue.identifier },
      { orderBy: { createdAt: 'ASC' } },
    );

    const relations = await this.em.find(IssueRelation, {
      $or: [
        { sourceIdentifier: issue.identifier },
        { targetIdentifier: issue.identifier },
      ],
    });

    const prLinks = await this.em.find(PrLink, { issueIdentifier: issue.identifier });

    const blockedByIds: string[] = [];
    const relatedIds: string[] = [];

    for (const rel of relations) {
      if (rel.relationType === 'blocked_by' && rel.sourceIdentifier === issue.identifier) {
        blockedByIds.push(rel.targetIdentifier);
      } else if (rel.relationType === 'blocks' && rel.targetIdentifier === issue.identifier) {
        blockedByIds.push(rel.sourceIdentifier);
      } else if (rel.relationType === 'relates_to') {
        const other =
          rel.sourceIdentifier === issue.identifier ? rel.targetIdentifier : rel.sourceIdentifier;
        relatedIds.push(other);
      }
    }

    const activityFeed = activities.map((act) => {
      const actor = membersMap.get(act.actorId) || membersMap.get('ln');
      const timeAgo = formatTimeAgo(act.createdAt);

      if (act.kind === 'comment') {
        let body = act.commentBlocks;
        if (
          !Array.isArray(body) ||
          body.length === 0 ||
          body.every((b) => !b || typeof b !== 'object' || !('type' in b))
        ) {
          body = [{ type: 'paragraph', text: act.text || '' }];
        }
        return {
          kind: 'comment' as const,
          id: act.id,
          actor,
          timeAgo,
          body,
          reactions: act.reactions || [],
        };
      }
      return {
        kind: 'event' as const,
        id: act.id,
        actor,
        event: act.event || 'status',
        text: act.text || '',
        timeAgo,
      };
    });

    // Default description if blocks empty
    const descriptionBlocks =
      issue.descriptionBlocks && issue.descriptionBlocks.length > 0
        ? issue.descriptionBlocks
        : [
            { type: 'heading', text: 'Context' },
            {
              type: 'paragraph',
              text: issue.description || issue.title,
            },
          ];

    return {
      identifier: issue.identifier,
      description: descriptionBlocks,
      activity: activityFeed,
      subIssueIds: base.subissues,
      relatedIds: relatedIds.length > 0 ? relatedIds : undefined,
      blockedByIds: blockedByIds.length > 0 ? blockedByIds : undefined,
      prLinks: prLinks.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
      })),
      milestone: issue.milestone,
    };
  }

  async create(dto: CreateIssueDto) {
    let identifier = dto.identifier;
    if (!identifier) {
      // Find highest LNUI- number
      const allIssues = await this.em.find(Issue, {});
      let maxNum = 700;
      for (const i of allIssues) {
        const match = i.identifier.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      identifier = `LNUI-${maxNum + 1}`;
    }

    const statusCategory =
      dto.statusCategory || ALL_STATUSES[dto.statusId || 'to-do']?.category || 'unstarted';

    const id = v7();
    const issue = new Issue({
      id,
      identifier,
      title: dto.title,
      description: dto.description || '',
      descriptionBlocks: dto.descriptionBlocks || [],
      statusId: dto.statusId || 'to-do',
      statusCategory,
      priorityId: dto.priorityId || 'no-priority',
      assigneeId: dto.assigneeId,
      creatorId: dto.creatorId || 'ln',
      teamId: dto.teamId || 'CORE',
      projectId: dto.projectId,
      cycleId: dto.cycleId ?? '',
      parentIssueId: dto.parentIssueId,
      rank: dto.rank || '0|hzzzzz:',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      milestone: dto.milestone,
    });

    this.em.persist(issue);

    if (dto.labelIds && dto.labelIds.length > 0) {
      const ilEntities = dto.labelIds.map((lid) => new IssueLabel(identifier, lid));
      this.em.persist(ilEntities);
    }

    // Record creation activity
    const activity = new IssueActivity({
      issueIdentifier: identifier,
      actorId: dto.creatorId || 'ln',
      kind: 'event',
      event: 'created',
      text: 'created this issue',
    });
    this.em.persist(activity);
    await this.em.flush();

    return this.findOne(identifier);
  }

  async update(identifierOrId: string, dto: UpdateIssueDto) {
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (!issue) throw new NotFoundException(`Issue ${identifierOrId} not found`);

    if (dto.title !== undefined) issue.title = dto.title;
    if (dto.description !== undefined) issue.description = dto.description;
    if (dto.descriptionBlocks !== undefined) issue.descriptionBlocks = dto.descriptionBlocks;
    if (dto.statusId !== undefined) {
      const oldStatus = issue.statusId;
      issue.statusId = dto.statusId;
      issue.statusCategory =
        dto.statusCategory || ALL_STATUSES[dto.statusId]?.category || issue.statusCategory;

      if (oldStatus !== dto.statusId) {
        const act = new IssueActivity({
          issueIdentifier: issue.identifier,
          actorId: 'ln',
          kind: 'event',
          event: 'status',
          text: `changed status to ${ALL_STATUSES[dto.statusId]?.name || dto.statusId}`,
        });
        this.em.persist(act);
      }
    }
    if (dto.priorityId !== undefined) {
      const oldPriority = issue.priorityId;
      issue.priorityId = dto.priorityId;
      if (oldPriority !== dto.priorityId) {
        const act = new IssueActivity({
          issueIdentifier: issue.identifier,
          actorId: 'ln',
          kind: 'event',
          event: 'priority',
          text: `set priority to ${ALL_PRIORITIES[dto.priorityId]?.name || dto.priorityId}`,
        });
        this.em.persist(act);
      }
    }
    if (dto.assigneeId !== undefined) {
      issue.assigneeId = dto.assigneeId;
      const act = new IssueActivity({
        issueIdentifier: issue.identifier,
        actorId: 'ln',
        kind: 'event',
        event: 'assignment',
        text: dto.assigneeId ? `assigned to ${dto.assigneeId}` : 'unassigned',
      });
      this.em.persist(act);
    }
    if (dto.teamId !== undefined) issue.teamId = dto.teamId;
    if (dto.projectId !== undefined) issue.projectId = dto.projectId;
    if (dto.cycleId !== undefined) issue.cycleId = dto.cycleId;
    if (dto.parentIssueId !== undefined) issue.parentIssueId = dto.parentIssueId;
    if (dto.rank !== undefined) issue.rank = dto.rank;
    if (dto.dueDate !== undefined) issue.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (dto.milestone !== undefined) issue.milestone = dto.milestone;

    if (dto.labelIds !== undefined) {
      const existing = await this.em.find(IssueLabel, {
        $or: [{ issueId: issue.id }, { issueId: issue.identifier }],
      });
      for (const e of existing) {
        this.em.remove(e);
      }
      if (dto.labelIds.length > 0) {
        const newIls = dto.labelIds.map((lid) => new IssueLabel(issue.identifier, lid));
        this.em.persist(newIls);
      }
    }

    await this.em.flush();
    return this.findOne(issue.identifier);
  }

  async updateRank(identifierOrId: string, rank: string) {
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (!issue) throw new NotFoundException(`Issue ${identifierOrId} not found`);

    issue.rank = rank;
    await this.em.flush();
    return { success: true, identifier: issue.identifier, rank };
  }

  async delete(identifierOrId: string) {
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (issue) {
      this.em.remove(issue);
      await this.em.flush();
    }
    return { success: true };
  }

  async addComment(identifierOrId: string, dto: CreateCommentDto) {
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (!issue) throw new NotFoundException(`Issue ${identifierOrId} not found`);

    const textContent =
      dto.textContent ||
      (Array.isArray(dto.commentBlocks) && dto.commentBlocks[0]?.text) ||
      '';
    const commentBlocks =
      Array.isArray(dto.commentBlocks) &&
      dto.commentBlocks.length > 0 &&
      dto.commentBlocks.some((b) => b && typeof b === 'object' && 'type' in b)
        ? dto.commentBlocks
        : [{ type: 'paragraph', text: textContent }];

    const comment = new IssueActivity({
      issueIdentifier: issue.identifier,
      actorId: dto.actorId,
      kind: 'comment',
      text: textContent,
      commentBlocks: commentBlocks,
    });

    this.em.persist(comment);
    await this.em.flush();
    return this.findDetail(issue.identifier);
  }

  async addReaction(activityId: string, dto: AddReactionDto) {
    const act = await this.em.findOne(IssueActivity, { id: activityId });
    if (!act) throw new NotFoundException(`Activity ${activityId} not found`);

    const reactions = act.reactions || [];
    const found = reactions.find((r: any) => r.emoji === dto.emoji);
    if (found) {
      found.count += 1;
    } else {
      reactions.push({ emoji: dto.emoji, count: 1, userIds: dto.userId ? [dto.userId] : [] });
    }
    act.reactions = [...reactions];
    await this.em.flush();
    return act;
  }

  async addRelation(identifierOrId: string, dto: AddRelationDto) {
    const issue = await this.em.findOne(Issue, {
      $or: [{ identifier: identifierOrId }, { id: identifierOrId }],
    });
    if (!issue) throw new NotFoundException(`Issue ${identifierOrId} not found`);

    const relation = new IssueRelation({
      sourceIdentifier: issue.identifier,
      targetIdentifier: dto.targetIdentifier,
      relationType: dto.relationType,
    });

    this.em.persist(relation);
    await this.em.flush();
    return this.findDetail(issue.identifier);
  }
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
