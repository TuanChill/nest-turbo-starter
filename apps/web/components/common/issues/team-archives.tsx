'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import QueryErrorState from '@/components/common/query-error-state';
import { useArchivedIssues, useRestoreIssue } from '@/hooks/queries/use-issues-query';
import { ROUTES } from '@/constants/routes';

export default function TeamArchives() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: issues = [], isLoading, isError, error, refetch } = useArchivedIssues(teamId);
   const restoreMutation = useRestoreIssue();

   if (isLoading) {
      return (
         <div className="p-6 text-sm text-muted-foreground">Loading recently deleted issues…</div>
      );
   }

   if (isError) {
      return <QueryErrorState subject="team archive" error={error} onRetry={refetch} />;
   }

   return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
         <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Team archive</p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold">
               <Archive className="size-5" /> Recently deleted issues
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
               Deleted issues remain available here for restoration while they are retained.
            </p>
         </div>

         {issues.length === 0 ? (
            <Card>
               <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No recently deleted issues.
               </CardContent>
            </Card>
         ) : (
            <div className="space-y-3">
               {issues.map((issue) => (
                  <Card key={issue.id}>
                     <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                        <div className="min-w-0">
                           <CardTitle className="text-sm font-medium">
                              <Link
                                 className="mr-2 font-mono text-muted-foreground hover:text-foreground"
                                 href={ROUTES.WORKSPACE.ISSUE(orgId, issue.identifier)}
                              >
                                 {issue.identifier}
                              </Link>
                              <span>{issue.title}</span>
                           </CardTitle>
                           <p className="mt-1 text-xs text-muted-foreground">
                              Deleted{' '}
                              {issue.deletedAt
                                 ? new Date(issue.deletedAt).toLocaleString()
                                 : 'recently'}
                           </p>
                        </div>
                        <Button
                           size="sm"
                           variant="outline"
                           disabled={restoreMutation.isPending}
                           onClick={() => restoreMutation.mutate(issue.identifier)}
                        >
                           <RotateCcw className="size-3.5" />
                           Restore
                        </Button>
                     </CardHeader>
                  </Card>
               ))}
            </div>
         )}
      </div>
   );
}
