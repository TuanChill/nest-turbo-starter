import { MotionConfig } from 'motion/react';

import { SiteHeader } from '@/components/marketing/site-header';
import { HeroSection } from '@/components/marketing/hero-section';
import { FeaturesSection } from '@/components/marketing/features-section';
import { CtaSection } from '@/components/marketing/cta-section';
import { SiteFooter } from '@/components/marketing/site-footer';

export function LandingPage() {
   return (
      <MotionConfig reducedMotion="user">
         <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />
            <main className="flex-1">
               <HeroSection />
               <FeaturesSection />
               <CtaSection />
            </main>
            <SiteFooter />
         </div>
      </MotionConfig>
   );
}
