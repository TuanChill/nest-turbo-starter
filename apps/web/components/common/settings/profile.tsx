'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useUpdateMember } from '@/hooks/queries/use-members-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Profile" settings. */
export default function Profile() {
   const authUser = useAuthStore((s) => s.user);
   const setUser = useAuthStore((s) => s.setUser);
   const updateMember = useUpdateMember();
   const me = authUser;
   const [name, setName] = useState(me?.name || '');

   useEffect(() => {
      setName(me?.name || '');
   }, [me?.name]);

   if (!me) {
      return (
         <SettingsShell title="Profile">
            <SettingsSection>
               <SettingsCard>
                  <p className="p-4 text-sm text-muted-foreground">
                     Your profile is unavailable until the authenticated member record loads.
                  </p>
               </SettingsCard>
            </SettingsSection>
         </SettingsShell>
      );
   }

   const handleSaveName = () => {
      const trimmed = name.trim();
      if (!trimmed || trimmed === me.name) {
         setName(me.name || '');
         return;
      }
      updateMember.mutate(
         { id: me.id, payload: { name: trimmed } },
         {
            onSuccess: () => {
               setUser({ ...me, name: trimmed });
               toast.success('Name updated');
            },
         }
      );
   };

   return (
      <SettingsShell title="Profile">
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title="Profile picture"
                  trailing={
                     <Avatar className="size-9">
                        <AvatarImage src={me.avatarUrl} alt={me.name} />
                        <AvatarFallback>{me.name ? me.name[0] : 'U'}</AvatarFallback>
                     </Avatar>
                  }
               />
               <SettingsRow
                  title="Email"
                  description="Email changes are not configured in this deployment."
                  trailing={<span className="text-foreground">{me.email}</span>}
               />
               <SettingsRow
                  title="Full name"
                  trailing={
                     <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        disabled={updateMember.isPending}
                        className="h-8 w-44"
                     />
                  }
               />
               <SettingsRow
                  title="Title"
                  description="Job-title persistence is not configured in this deployment."
                  trailing={<span className="text-xs text-muted-foreground">Unavailable</span>}
               />
               <SettingsRow
                  title="Username"
                  description="Username persistence is not configured in this deployment."
                  trailing={<span className="text-xs text-muted-foreground">Unavailable</span>}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Workspace access">
            <SettingsCard>
               <SettingsRow
                  title="Remove yourself from workspace"
                  description="Workspace membership changes require an explicit membership contract."
                  trailing={<span className="text-xs text-muted-foreground">Unavailable</span>}
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
