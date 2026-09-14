import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
   return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
         <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-xl font-semibold tracking-tight text-foreground shadow-xs">
            404
         </div>
         <h1 className="mt-4 text-lg font-medium tracking-tight">Page not found</h1>
         <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            The page or resource you are looking for doesn&apos;t exist or may have been moved.
         </p>
         <div className="mt-6 flex items-center gap-3">
            <Button asChild size="sm">
               <Link href="/">Return to home</Link>
            </Button>
         </div>
      </div>
   );
}
