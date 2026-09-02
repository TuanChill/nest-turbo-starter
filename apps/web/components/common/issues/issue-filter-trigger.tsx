'use client';

import { IssueFilterPopover } from './issue-filter-popover';

/**
 * Standalone "Filter" button for the header toolbars matching Linear 1:1 (Image 4).
 * Clicking opens the multi-level filter popover (Status, Assignee, Priority, Labels, Dates).
 */
export function IssueFilterTrigger() {
   return <IssueFilterPopover />;
}
