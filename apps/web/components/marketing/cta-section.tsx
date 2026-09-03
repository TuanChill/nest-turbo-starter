import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/marketing/reveal';
import { ROUTES } from '@/constants/routes';

export function CtaSection() {
   return (
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
         <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center shadow-xl shadow-black/20 sm:px-12">
               <div
                  className="motion-safe:animate-pulse pointer-events-none absolute -top-24 left-1/2 h-[250px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-3xl [animation-duration:8s]"
                  aria-hidden
               />
               <div className="relative">
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                     Start shipping with Circle
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                     Set up your workspace in minutes. No credit card required.
                  </p>
                  <Button size="lg" className="mt-8" asChild>
                     <Link href={ROUTES.AUTH.SIGNUP}>
                        Get started free
                        <ArrowRight className="size-4" />
                     </Link>
                  </Button>
               </div>
            </div>
         </Reveal>
      </section>
   );
}
