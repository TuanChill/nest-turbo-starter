import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateDocumentDto,
  CreateFolderDto,
  UpdateDocumentDto,
} from './dto/document.dto';
import { DocumentFolder, Member, TeamDocument } from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async findAllFolders(memberId: string, teamId?: string) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (accessibleTeamIds.length === 0) return [];

    const where: any = { teamId: { $in: accessibleTeamIds } };
    if (teamId) {
      if (!accessibleTeamIds.includes(teamId)) return [];
      where.teamId = teamId;
    }

    const folders = await this.em.find(DocumentFolder, where);
    const documents = await this.em.find(TeamDocument, {});
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, m]));

    return folders.map((folder) => {
      const folderDocs = documents
        .filter((d) => d.folderId === folder.id)
        .map((doc) => ({
          id: doc.id,
          name: doc.name,
          icon: doc.icon,
          creator: membersMap.get(doc.creatorId) || membersMap.get('ln'),
          createdAt: doc.createdAt.toISOString().split('T')[0],
          updatedAt: doc.updatedAt.toISOString().split('T')[0],
          pinned: doc.pinned,
          content: doc.content,
        }));

      return {
        id: folder.id,
        name: folder.name,
        icon: folder.icon,
        documents: folderDocs,
      };
    });
  }

  private async assertDocumentAccess(
    memberId: string,
    folderId: string,
    notFoundMessage: string,
  ) {
    const folder = await this.em.findOne(DocumentFolder, { id: folderId });
    if (!folder) throw new NotFoundException(notFoundMessage);
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(folder.teamId)) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  async findOne(id: string, memberId?: string) {
    const doc = await this.em.findOne(TeamDocument, { id });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    if (memberId) {
      await this.assertDocumentAccess(memberId, doc.folderId, `Document ${id} not found`);
    }

    const creator = await this.em.findOne(Member, { id: doc.creatorId });

    return {
      id: doc.id,
      name: doc.name,
      icon: doc.icon,
      folderId: doc.folderId,
      creator,
      createdAt: doc.createdAt.toISOString().split('T')[0],
      updatedAt: doc.updatedAt.toISOString().split('T')[0],
      pinned: doc.pinned,
      content: doc.content,
    };
  }

  async createFolder(dto: CreateFolderDto, memberId: string) {
    const teamId = dto.teamId || 'CORE';
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(teamId)) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    const id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const folder = new DocumentFolder({
      id,
      name: dto.name,
      icon: dto.icon || '📁',
      teamId,
    });

    this.em.persist(folder);
    await this.em.flush();
    return folder;
  }

  async createDocument(dto: CreateDocumentDto, creatorId: string) {
    await this.assertDocumentAccess(
      creatorId,
      dto.folderId,
      `Folder ${dto.folderId} not found`,
    );

    const id = dto.id || `doc-${Date.now()}`;
    const doc = new TeamDocument({
      id,
      folderId: dto.folderId,
      name: dto.name,
      icon: dto.icon || '📄',
      creatorId,
      pinned: dto.pinned || false,
      content: dto.content,
    });

    this.em.persist(doc);
    await this.em.flush();
    return this.findOne(id);
  }

  async updateDocument(id: string, dto: UpdateDocumentDto, memberId: string) {
    const doc = await this.em.findOne(TeamDocument, { id });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    await this.assertDocumentAccess(memberId, doc.folderId, `Document ${id} not found`);
    if (dto.folderId !== undefined && dto.folderId !== doc.folderId) {
      await this.assertDocumentAccess(
        memberId,
        dto.folderId,
        `Folder ${dto.folderId} not found`,
      );
    }

    if (dto.name !== undefined) doc.name = dto.name;
    if (dto.icon !== undefined) doc.icon = dto.icon;
    if (dto.folderId !== undefined) doc.folderId = dto.folderId;
    if (dto.pinned !== undefined) doc.pinned = dto.pinned;
    if (dto.content !== undefined) doc.content = dto.content;

    await this.em.flush();
    return this.findOne(id);
  }

  async deleteDocument(id: string, memberId: string) {
    const doc = await this.em.findOne(TeamDocument, { id });
    if (doc) {
      await this.assertDocumentAccess(memberId, doc.folderId, `Document ${id} not found`);
      this.em.remove(doc);
      await this.em.flush();
    }
    return { success: true };
  }
}
