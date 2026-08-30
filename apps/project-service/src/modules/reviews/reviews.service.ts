import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Member, Review } from '../../data-access';

@Injectable()
export class ReviewsService {
  constructor(private readonly em: EntityManager) {}

  private transformReview(review: Review, membersMap: Map<string, any>) {
    const author = membersMap.get(review.authorId) || membersMap.get('ln');
    return {
      id: review.id,
      title: review.title,
      author,
      status: review.status,
      resolves: review.resolves,
      branch: review.branch,
      createdAt: review.createdAt.toISOString().split('T')[0],
      updatedAt: review.updatedAt.toISOString().split('T')[0],
      fileStats: review.fileStats || [],
      commits: review.commits || [],
      summaryBullets: review.summaryBullets || [],
      verdicts: review.verdicts || [],
      guideSections: review.guideSections || [],
      fileDiffs: review.fileDiffs || [],
    };
  }

  async findAll(status?: 'open' | 'merged' | 'closed') {
    const where: any = {};
    if (status) where.status = status;

    const reviews = await this.em.find(Review, where, {
      orderBy: { createdAt: 'DESC' },
    });
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, m]));

    return reviews.map((r) => this.transformReview(r, membersMap));
  }

  async findOne(id: string) {
    const review = await this.em.findOne(Review, { id });
    if (!review) throw new NotFoundException(`Review ${id} not found`);

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, m]));

    return this.transformReview(review, membersMap);
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
    return this.findOne(id);
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
