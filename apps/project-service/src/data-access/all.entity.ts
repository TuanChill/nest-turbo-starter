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

import { Member } from './member/member.entity';
import { Team } from './team/team.entity';
import { TeamMember } from './team/team-member.entity';
import { Label, IssueLabel, ProjectLabel } from './label/label.entity';
import { Project } from './project/project.entity';
import { ProjectMilestone } from './project/project-milestone.entity';
import { ProjectUpdate } from './project/project-update.entity';
import { Cycle } from './cycle/cycle.entity';
import { Issue } from './issue/issue.entity';
import { IssueActivity } from './issue/issue-activity.entity';
import { IssueRelation, PrLink } from './issue/issue-relation.entity';
import { Initiative } from './initiative/initiative.entity';
import { DocumentFolder, TeamDocument } from './document/document.entity';
import { Notification } from './notification/notification.entity';
import { SavedView } from './view/saved-view.entity';
import { Review } from './review/review.entity';

export const ALL_ENTITIES = [
  Member,
  Team,
  TeamMember,
  Label,
  IssueLabel,
  ProjectLabel,
  Project,
  ProjectMilestone,
  ProjectUpdate,
  Cycle,
  Issue,
  IssueActivity,
  IssueRelation,
  PrLink,
  Initiative,
  DocumentFolder,
  TeamDocument,
  Notification,
  SavedView,
  Review,
];
