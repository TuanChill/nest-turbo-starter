import { Cycle } from './cycle/cycle.entity';
import { DocumentFolder, TeamDocument } from './document/document.entity';
import { InitiativeActivity } from './initiative/initiative-activity.entity';
import { Initiative } from './initiative/initiative.entity';
import { IssueActivity } from './issue/issue-activity.entity';
import { IssueRelation, PrLink } from './issue/issue-relation.entity';
import { IssueTemplate } from './issue/issue-template.entity';
import { Issue } from './issue/issue.entity';
import { LabelGroup } from './label/label-group.entity';
import { IssueLabel, Label, ProjectLabel } from './label/label.entity';
import { Member } from './member/member.entity';
import { Notification } from './notification/notification.entity';
import { ProjectMember } from './project/project-member.entity';
import { ProjectMilestone } from './project/project-milestone.entity';
import { ProjectTemplate } from './project/project-template.entity';
import { ProjectUpdate } from './project/project-update.entity';
import { Project } from './project/project.entity';
import { Review } from './review/review.entity';
import { TeamMember } from './team/team-member.entity';
import { Team } from './team/team.entity';
import { SavedView } from './view/saved-view.entity';
import { WorkspaceMember } from './workspace/workspace-member.entity';
import { Workspace } from './workspace/workspace.entity';

export * from './workspace';
export * from './member';
export * from './team';
export * from './label';
export * from './project';
export * from './cycle';
export * from './issue';
export * from './initiative';
export * from './document';
export * from './notification';
export * from './view';
export * from './review';

export const ALL_ENTITIES = [
  Workspace,
  WorkspaceMember,
  Member,
  Team,
  TeamMember,
  Label,
  LabelGroup,
  IssueLabel,
  ProjectLabel,
  Project,
  ProjectMilestone,
  ProjectMember,
  ProjectTemplate,
  ProjectUpdate,
  Cycle,
  Issue,
  IssueTemplate,
  IssueActivity,
  IssueRelation,
  PrLink,
  Initiative,
  InitiativeActivity,
  DocumentFolder,
  TeamDocument,
  Notification,
  SavedView,
  Review,
];
