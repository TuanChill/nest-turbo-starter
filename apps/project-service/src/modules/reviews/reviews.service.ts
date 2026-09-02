import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Member, Review, toSafeMember } from '../../data-access';

@Injectable()
export class ReviewsService {
  constructor(private readonly em: EntityManager) {}

  private transformReview(review: Review, membersMap: Map<string, any>, userId?: string) {
    const author = membersMap.get(review.authorId) || membersMap.get('ln');
    const files = review.fileStats || [];
    const additions = files.reduce((acc: number, f: any) => acc + (f.additions || 0), 0);
    const deletions = files.reduce((acc: number, f: any) => acc + (f.deletions || 0), 0);
    return {
      id: review.id,
      title: review.title,
      author,
      // No dedicated reviewer-assignment field exists yet, so "for-you" is
      // simply "reviews you didn't author" — same fallback semantics as
      // Linear when nobody has been explicitly requested as a reviewer.
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
      timeAgo: review.updatedAt.toISOString().split('T')[0],
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

  async findAll(status?: 'open' | 'merged' | 'closed', userId?: string) {
    const where: any = {};
    if (status) where.status = status;

    const reviews = await this.em.find(Review, where, {
      orderBy: { createdAt: 'DESC' },
    });
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return reviews.map((r) => this.transformReview(r, membersMap, userId));
  }

  async findOne(id: string, userId?: string) {
    const review = await this.em.findOne(Review, { id });
    if (!review) throw new NotFoundException(`Review ${id} not found`);

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return this.transformReview(review, membersMap, userId);
  }

  async create(dto: CreateReviewDto, authorId: string) {
    const id = dto.id || `rev-${Date.now()}`;
    const review = new Review({
      id,
      title: dto.title,
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

  async update(id: string, dto: UpdateReviewDto) {
    const review = await this.em.findOne(Review, { id });
    if (!review) throw new NotFoundException(`Review ${id} not found`);

    if (dto.title !== undefined) review.title = dto.title;
    if (dto.status !== undefined) review.status = dto.status;
    if (dto.resolves !== undefined) review.resolves = dto.resolves;
    if (dto.branch !== undefined) review.branch = dto.branch;

    await this.em.flush();
    return this.findOne(id);
  }
}
