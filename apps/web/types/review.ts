export type ReviewStatus = 'open' | 'merged' | 'closed';
export type ReviewList = 'for-you' | 'created';
export type ReviewFileCategory = 'implementation' | 'tests' | string;

export interface ReviewFileStat {
   name: string;
   path: string;
   additions: number;
   deletions: number;
   category?: ReviewFileCategory;
}

export interface ReviewCommit {
   sha: string;
   message: string;
   timeAgo?: string;
}

export interface DiffLine {
   type: 'context' | 'add' | 'del' | 'skip';
   number?: number;
   text?: string;
   count?: number;
}

export interface FileDiff {
   name: string;
   path: string;
   additions: number;
   deletions: number;
   lines: DiffLine[];
}

export interface GuideSection {
   title: string;
   paragraphs: string[];
   fileRefs: { name: string; path: string; stat: string }[];
   diffName?: string;
}

export interface Review {
   id: string;
   title: string;
   status: ReviewStatus;
   list: ReviewList;
   timeAgo: string;
   author: Record<string, unknown> | null;
   sourceBranch?: string;
   additions: number;
   deletions: number;
   resolves: { identifier: string; title?: string };
   checksPassed: number;
   checksTotal: number;
   files: ReviewFileStat[];
   commits: ReviewCommit[];
   summary: string[];
   verdicts: unknown[];
   guideSections: GuideSection[];
   fileDiffs: FileDiff[];
   repo?: string;
   prNumber?: number;
   targetBranch?: string;
   testPlan?: { text: string; checked: boolean }[];
   deployment?: { project: string; state: string; action: string };
   reviewNote?: {
      author: string;
      timeAgo: string;
      verdictLine: string;
      profileLine: string;
      rows: {
         review: string;
         verdict: string;
         critical: string;
         high: string;
         medium: string;
      }[];
      footer?: string;
   };
}
