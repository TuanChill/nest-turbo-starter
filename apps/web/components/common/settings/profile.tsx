'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useMembers, useUpdateMember } from '@/hooks/queries/use-members-query';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Profile" settings. */
export default function Profile() {
   const authUser = useAuthStore((s) => s.user);
   const setUser = useAuthStore((s) => s.setUser);
   const { data: members = [] } = useMembers();
   const updateMember = useUpdateMember();
   const firstMember = members[0];
   const me = authUser ||
      firstMember || {
         id: 'ln',
         name: 'LN Dev',
         email: 'ln@example.com',
         avatarUrl: 'https://avatar.vercel.sh/ln',
         username: 'ln',
         role: 'admin',
      };

   const [name, setName] = useState(me.name || '');

   useEffect(() => {
      setName(me.name || '');
   }, [me.name]);

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
                  trailing={
                     <span className="inline-flex items-center gap-2 text-foreground">
                        {me.email}
                        <Button size="icon" variant="ghost" className="size-6">
                           <Pencil className="size-3" />
                        </Button>
                     </span>
                  }
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
                  description="Your job title or role"
                  trailing={<Input placeholder="Software engineer" className="h-8 w-44" />}
               />
               <SettingsRow
                  title="Username"
                  description="One word, like a nickname or first name"
                  trailing={
                     <Input
                        defaultValue={
                           ('username' in me
                              ? (me as { username?: string }).username
                              : undefined) ||
                           (me.name ? me.name.toLowerCase().replace(/\s+/g, '') : 'ln')
                        }
                        className="h-8 w-44"
                     />
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Workspace access">
            <SettingsCard>
               <SettingsRow
                  title="Remove yourself from workspace"
                  trailing={
                     <Button size="xs" variant="ghost" className="text-red-500 hover:text-red-500">
                        Leave workspace
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
