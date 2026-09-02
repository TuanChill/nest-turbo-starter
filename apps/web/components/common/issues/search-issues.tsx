'use client';

import { useIssuesStore } from '@/store/issues-store';
import { useSearchStore } from '@/store/search-store';
import { useMemo } from 'react';
import { IssueLine } from './issue-line';
import { useIssues } from '@/hooks/queries/use-issues-query';

export function SearchIssues() {
   const { data: serverIssues = [] } = useIssues();
   const { issues: storeIssues = [] } = useIssuesStore();
   const { searchQuery, isSearchOpen } = useSearchStore();

   const issues = useMemo(() => {
      const ids = new Set(serverIssues.map((i) => i.id));
      const idents = new Set(serverIssues.map((i) => i.identifier));
      const extras = storeIssues.filter((i) => !ids.has(i.id) && !idents.has(i.identifier));
      return [...serverIssues, ...extras];
   }, [serverIssues, storeIssues]);

   const searchResults = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      if (query === '') return [];
      return issues.filter(
         (issue) =>
            issue.title.toLowerCase().includes(query) ||
            issue.identifier.toLowerCase().includes(query)
      );
   }, [issues, searchQuery]);

   if (!isSearchOpen) {
      return null;
   }

   return (
      <div className="w-full">
         {searchQuery.trim() !== '' && (
            <div>
               {searchResults.length > 0 ? (
                  <div className="border rounded-md mt-4">
                     <div className="py-2 px-4 border-b bg-muted/50">
                        <h3 className="text-sm font-medium">Results ({searchResults.length})</h3>
                     </div>
                     <div className="divide-y">
                        {searchResults.map((issue) => (
                           <IssueLine key={issue.id} issue={issue} layoutId={false} />
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="text-center py-8 text-muted-foreground">
                     No results found for &quot;{searchQuery}&quot;
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
