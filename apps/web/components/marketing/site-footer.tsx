import Link from 'next/link';

import { BrandLogo } from '@/components/marketing/brand-logo';
import { ROUTES } from '@/constants/routes';

export function SiteFooter() {
   return (
      <footer className="border-t border-border/60">
         <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
            <BrandLogo iconClassName="size-7" />

            <nav className="flex items-center gap-6">
               <Link
                  href="#features"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
               >
                  Features
               </Link>
               <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
               >
                  Log in
               </Link>
               <Link
                  href={ROUTES.AUTH.SIGNUP}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
               >
                  Sign up
               </Link>
            </nav>

            <p className="text-xs text-muted-foreground">
               &copy; {new Date().getFullYear()} Circle. All rights reserved.
            </p>
         </div>
      </footer>
   );
}
