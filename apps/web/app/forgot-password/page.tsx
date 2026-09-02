'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';

import { sendForgotPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';

const forgotSchema = z.object({
   email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
   const [isSubmitted, setIsSubmitted] = React.useState(false);
   const [isLoading, setIsLoading] = React.useState(false);

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<ForgotFormValues>({
      resolver: zodResolver(forgotSchema),
   });

   const onSubmit = async (data: ForgotFormValues) => {
      setIsLoading(true);
      try {
         await sendForgotPassword(data.email);
         setIsSubmitted(true);
         toast.success('Password reset link sent to your email');
      } catch (err: unknown) {
         const message = err instanceof Error ? err.message : 'Could not process request';
         toast.error(message);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
         <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

         <div className="w-full max-w-[380px] z-10 flex flex-col items-center">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 mb-6">
               <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-sm shadow-md shadow-orange-500/20">
                  <svg
                     className="size-4.5"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2.5"
                  >
                     <circle cx="12" cy="12" r="9" />
                     <path d="M12 7v5l3 3" />
                  </svg>
               </div>
               <span className="font-semibold text-lg tracking-tight text-foreground">Circle</span>
            </div>

            {/* Form Card */}
            <div className="w-full rounded-xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 shadow-xl shadow-black/40">
               <div className="space-y-1 mb-6 text-center sm:text-left">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                     Reset your password
                  </h2>
                  <p className="text-xs text-muted-foreground">
                     Enter your email and we&apos;ll send you a recovery link.
                  </p>
               </div>

               {!isSubmitted ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-medium text-foreground">
                           Email address
                        </Label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                           <Input
                              id="email"
                              type="email"
                              placeholder="name@company.com"
                              className="pl-9 h-10 text-sm bg-background/60 border-input"
                              disabled={isLoading}
                              {...register('email')}
                           />
                        </div>
                        {errors.email && (
                           <p className="text-[11px] text-destructive font-medium">
                              {errors.email.message}
                           </p>
                        )}
                     </div>

                     <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-10 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                     >
                        {isLoading ? (
                           <>
                              <div className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Sending link...
                           </>
                        ) : (
                           <>
                              Send Reset Instructions
                              <ArrowRight className="size-3.5 ml-1.5" />
                           </>
                        )}
                     </Button>
                  </form>
               ) : (
                  <div className="space-y-4 text-center py-2">
                     <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                        <Mail className="size-5" />
                     </div>
                     <p className="text-xs text-muted-foreground">
                        If an account exists with that email, we have dispatched a password reset
                        link.
                     </p>
                     <Button variant="outline" asChild className="w-full h-9 text-xs">
                        <Link href={ROUTES.AUTH.LOGIN}>
                           <ArrowLeft className="size-3.5 mr-1.5" />
                           Return to Log in
                        </Link>
                     </Button>
                  </div>
               )}
            </div>

            {/* Bottom link */}
            <p className="text-xs text-muted-foreground mt-6 text-center">
               Remember your password?{' '}
               <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="font-medium text-foreground hover:underline transition-all"
               >
                  Log in
               </Link>
            </p>
         </div>
      </div>
   );
}
