import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { v7 } from 'uuid';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { assertReviewIssueScope } from './review-scope';
import {
  Issue,
  Member,
  Review,
  Team,
  toSafeMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { requireWorkspaceSelection } from '../workspaces/workspace-selection';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private transformReview(review: Review, membersMap: Map<string, any>, userId?: string) {
    const author = membersMap.get(review.authorId) ?? null;
    const files = review.fileStats || [];
    const additions = files.reduce((acc: number, f: any) => acc + (f.additions || 0), 0);
    const deletions = files.reduce((acc: number, f: any) => acc + (f.deletions || 0), 0);
    return {
      id: review.id,
      title: review.title,
      author,
      // No dedicated reviewer-assignment field exists yet. Keep the existing
      // persisted classification deterministic until reviewer assignments are
      // modeled rather than inventing a reviewer or notification record.
      list: userId && review.authorId === userId ? 'created' : 'for-you',
      status: review.status,
      // No GitHub PR integration exists — only the identifier (matching the
      // frontend's `resolves.identifier` contract) is real; there is no
      // fetched issue title to attach here.
      resolves: { identifier: review.resolves || '' },
      sourceBranch: review.branch,
      additions,
      deletions,
      checksPassed: 0,
      checksTotal: 0,
      timeAgo: formatTimeAgo(review.updatedAt),
      createdAt: review.createdAt.toISOString().split('T')[0],
      updatedAt: review.updatedAt.toISOString().split('T')[0],
      files,
      commits: review.commits || [],
      summary: review.summaryBullets || [],
      verdicts: review.verdicts || [],
      guideSections: review.guideSections || [],
      fileDiffs: review.fileDiffs || [],
    };
  }

  private async assertResolvesIssue(
    identifier: string,
    workspaceId: string,
    memberId: string,
  ) {
    const issue = await this.em.findOne(Issue, { identifier });
    const team = issue ? await this.em.findOne(Team, { id: issue.teamId }) : null;
    const accessibleTeamIds = new Set(
      await this.workspacesService.getAccessibleTeamIds(memberId),
    );
    assertReviewIssueScope(
      identifier,
      issue?.teamId ?? '',
      team?.workspaceId,
      workspaceId,
      accessibleTeamIds,
    );
  }

  async findAll(status?: 'open' | 'merged' | 'closed', userId?: string) {
    if (!userId) return [];
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(userId);
    if (accessibleWorkspaceIds.length === 0) return [];
    const where: any = {};
    if (status) where.status = status;
    where.workspaceId = { $in: accessibleWorkspaceIds };

    const reviews = await this.em.find(Review, where, {
      orderBy: { createdAt: 'DESC' },
    });
    const memberships = await this.em.find(WorkspaceMember, {
      workspaceId: { $in: accessibleWorkspaceIds },
    });
    const memberIds = [...new Set(memberships.map((membership) => membership.memberId))];
    const members = await this.em.find(Member, { id: { $in: memberIds } });
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return reviews.map((r) => this.transformReview(r, membersMap, userId));
  }

  async findOne(id: string, userId?: string) {
    const review = await this.em.findOne(Review, { id });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    if (!userId) throw new NotFoundException(`Review ${id} not found`);
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(userId);
    if (!review.workspaceId || !accessibleWorkspaceIds.includes(review.workspaceId)) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    const memberships = await this.em.find(WorkspaceMember, {
      workspaceId: review.workspaceId,
    });
    const memberIds = [...new Set(memberships.map((membership) => membership.memberId))];
    const members = await this.em.find(Member, { id: { $in: memberIds } });
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return this.transformReview(review, membersMap, userId);
  }

  async create(dto: CreateReviewDto, authorId: string) {
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(authorId);
    if (accessibleWorkspaceIds.length === 0) {
      throw new NotFoundException('No accessible workspace found');
    }
    let workspaceId: string;
    if (dto.workspaceId) {
      const workspace = await this.em.findOne(Workspace, {
        $or: [{ id: dto.workspaceId }, { slug: dto.workspaceId }],
      });
      if (!workspace || !accessibleWorkspaceIds.includes(workspace.id)) {
        throw new NotFoundException(`Workspace ${dto.workspaceId} not found`);
      }
      workspaceId = workspace.id;
    } else {
      workspaceId = requireWorkspaceSelection(accessibleWorkspaceIds);
    }
    if (dto.resolves) {
      await this.assertResolvesIssue(dto.resolves, workspaceId, authorId);
    }
    const id = dto.id || v7();
    const review = new Review({
      id,
      title: dto.title,
      workspaceId,
      authorId,
      status: dto.status || 'open',
      resolves: dto.resolves,
      branch: dto.branch,
      fileStats: dto.fileStats || [],
      commits: dto.commits || [],
      summaryBullets: dto.summaryBullets || [],
      verdicts: dto.verdicts || [],
      guideSections: dto.guideSections || [],
      fileDiffs: dto.fileDiffs || [],
    });

    this.em.persist(review);
    await this.em.flush();
    return this.findOne(id, authorId);
  }

  async update(id: string, dto: UpdateReviewDto, userId: string) {
    const review = await this.em.findOne(Review, { id });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(userId);
    if (!review.workspaceId || !accessibleWorkspaceIds.includes(review.workspaceId)) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    if (dto.title !== undefined) review.title = dto.title;
    if (dto.status !== undefined) review.status = dto.status;
    if (dto.resolves !== undefined) review.resolves = dto.resolves;
    if (dto.branch !== undefined) review.branch = dto.branch;

    if (dto.resolves) {
      await this.assertResolvesIssue(dto.resolves, review.workspaceId!, userId);
    }

    await this.em.flush();
    return this.findOne(id, userId);
  }
}

function formatTimeAgo(date: Date): string {
  const diffMs = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
