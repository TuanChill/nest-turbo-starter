'use client';

import { useSearchStore } from '@/store/search-store';
import { useMemo } from 'react';
import { IssueLine } from './issue-line';
import { useIssues } from '@/hooks/queries/use-issues-query';

export function SearchIssues() {
   const { data: serverIssues = [] } = useIssues();
   const { searchQuery, isSearchOpen } = useSearchStore();

   const issues = serverIssues;

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
