'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCw } from 'lucide-react';

interface QueryErrorStateProps {
   /** What failed to load, phrased for the user (e.g. "views", "notifications"). */
   subject: string;
   error?: unknown;
   onRetry?: () => void;
   compact?: boolean;
}

/**
 * Shared error state for data that failed to load.
 *
 * Exists so a failed request surfaces as a visible error rather than an empty
 * list or substituted mock data — a screen that silently shows fake content is
 * harder to diagnose than one that admits the failure.
 */
export default function QueryErrorState({
   subject,
   error,
   onRetry,
   compact = false,
}: QueryErrorStateProps) {
   const detail = error instanceof Error ? error.message : undefined;

   return (
      <div className={compact ? 'w-full p-2' : 'w-full h-full p-6'}>
         <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load {subject}</AlertTitle>
            <AlertDescription className="space-y-3">
               <p>{detail ?? 'The server did not respond. Check that the API is running.'}</p>
               {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                     <RotateCw className="size-3.5" />
                     Retry
                  </Button>
               )}
            </AlertDescription>
         </Alert>
      </div>
   );
}
