'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { BrandLogo } from '@/components/marketing/brand-logo';
import { ROUTES } from '@/constants/routes';

const navLinks = [{ label: 'Features', href: '#features' }];

export function SiteHeader() {
   const [mobileOpen, setMobileOpen] = React.useState(false);

   return (
      <motion.header
         initial={{ opacity: 0, y: -12 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
         className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl"
      >
         <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <BrandLogo />

            <nav className="hidden items-center gap-6 md:flex">
               {navLinks.map((link) => (
                  <Link
                     key={link.href}
                     href={link.href}
                     className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                     {link.label}
                  </Link>
               ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
               <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.AUTH.LOGIN}>Log in</Link>
               </Button>
               <Button size="sm" asChild>
                  <Link href={ROUTES.AUTH.SIGNUP}>Get started</Link>
               </Button>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
               <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
               >
                  <Menu className="size-5" />
               </Button>
               <SheetContent side="right" className="w-72">
                  <SheetHeader>
                     <SheetTitle>
                        <BrandLogo />
                     </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 px-4">
                     {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                           <Link
                              href={link.href}
                              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                           >
                              {link.label}
                           </Link>
                        </SheetClose>
                     ))}
                  </nav>
                  <div className="mt-auto flex flex-col gap-2 p-4">
                     <SheetClose asChild>
                        <Button variant="outline" asChild>
                           <Link href={ROUTES.AUTH.LOGIN}>Log in</Link>
                        </Button>
                     </SheetClose>
                     <SheetClose asChild>
                        <Button asChild>
                           <Link href={ROUTES.AUTH.SIGNUP}>Get started</Link>
                        </Button>
                     </SheetClose>
                  </div>
               </SheetContent>
            </Sheet>
         </div>
      </motion.header>
   );
}
