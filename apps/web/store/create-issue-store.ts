import { Status } from '@/mock-data/status';
import { Project } from '@/mock-data/projects';
import { Cycle } from '@/mock-data/cycles';
import { create } from 'zustand';

export interface CreateIssueOptions {
   status?: Status | null;
   project?: Project | null;
   teamId?: string | null;
   cycle?: Cycle | null;
}

interface CreateIssueState {
   isOpen: boolean;
   defaultStatus: Status | null;
   defaultProject: Project | null;
   defaultTeamId: string | null;
   defaultCycle: Cycle | null;

   // Actions
   openModal: (options?: CreateIssueOptions | Status) => void;
   closeModal: () => void;
   setDefaultStatus: (status: Status | null) => void;
   setDefaultProject: (project: Project | null) => void;
}

export const useCreateIssueStore = create<CreateIssueState>((set) => ({
   // Initial state
   isOpen: false,
   defaultStatus: null,
   defaultProject: null,
   defaultTeamId: null,
   defaultCycle: null,

   // Actions
   openModal: (options) => {
      if (!options) {
         set({ isOpen: true });
         return;
      }
      // Check if options is a Status object (has category and id)
      if ('id' in options && 'category' in options) {
         set({
            isOpen: true,
            defaultStatus: options as Status,
         });
         return;
      }
      const opt = options as CreateIssueOptions;
      set({
         isOpen: true,
         defaultStatus: opt.status !== undefined ? opt.status : null,
         defaultProject: opt.project !== undefined ? opt.project : null,
         defaultTeamId: opt.teamId !== undefined ? opt.teamId : null,
         defaultCycle: opt.cycle !== undefined ? opt.cycle : null,
      });
   },
   closeModal: () =>
      set({
         isOpen: false,
         defaultStatus: null,
         defaultProject: null,
         defaultTeamId: null,
         defaultCycle: null,
      }),
   setDefaultStatus: (status) => set({ defaultStatus: status }),
   setDefaultProject: (project) => set({ defaultProject: project }),
}));
