import { EntityRepository } from '@mikro-orm/postgresql';
import { WorkspaceInvitation } from './workspace-invitation.entity';

export class WorkspaceInvitationRepository extends EntityRepository<WorkspaceInvitation> {}
