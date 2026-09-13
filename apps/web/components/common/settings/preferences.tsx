'use client';

import { CustomizeSidebarDialog } from '@/components/layout/sidebar/customize-sidebar-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { SelectMenu, SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';
import { ThemePreferences } from './theme-preferences';
import { useWorkspaces } from '@/hooks/queries';
import { getActiveWorkspace, saveActiveWorkspace } from '@/lib/utils/workspace-persistence';
import { toast } from 'sonner';

/** Personal "Preferences" settings (general, theme, automations). */
export default function Preferences() {
   const [customizeOpen, setCustomizeOpen] = useState(false);
   const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
   const [defaultWorkspaceSlug, setDefaultWorkspaceSlug] = useState<string>('');

   useEffect(() => {
      const saved = getActiveWorkspace();
      if (saved) {
         setDefaultWorkspaceSlug(saved);
      } else if (workspaces && workspaces.length > 0) {
         setDefaultWorkspaceSlug(workspaces[0].slug);
      }
   }, [workspaces]);

   const handleDefaultWorkspaceChange = (slug: string) => {
      setDefaultWorkspaceSlug(slug);
      saveActiveWorkspace(slug);
      const wsName = workspaces?.find((w) => w.slug === slug)?.name || slug;
      toast.success(`Default workspace set to "${wsName}"`);
   };

   return (
      <SettingsShell title="Preferences">
         <SettingsSection title="General">
            <SettingsCard>
               <SettingsRow
                  title="Default workspace"
                  description="Select which workspace to open by default when launching the app"
                  trailing={
                     workspacesLoading ? (
                        <span className="text-xs text-muted-foreground">Loading...</span>
                     ) : workspaces && workspaces.length > 0 ? (
                        <SelectMenu
                           value={defaultWorkspaceSlug || workspaces[0]?.slug}
                           options={workspaces.map((ws) => ({
                              label: ws.name,
                              value: ws.slug,
                           }))}
                           onChange={handleDefaultWorkspaceChange}
                        />
                     ) : (
                        <span className="text-xs text-muted-foreground">No workspaces</span>
                     )
                  }
               />
               <SettingsRow
                  title="Default home view"
                  description="Select which view to display when launching the app"
                  trailing={<SelectMenu options={['Agent (default)', 'Inbox', 'My issues']} />}
               />
               <SettingsRow
                  title="Display names"
                  description="Select how names are displayed in the interface"
                  trailing={<SelectMenu options={['Username', 'Full name']} />}
               />
               <SettingsRow
                  title="First day of the week"
                  description="Used for date pickers"
                  trailing={<SelectMenu options={['Monday', 'Sunday', 'Saturday']} />}
               />
               <SettingsRow
                  title="Convert text emoticons into emojis"
                  description="Strings like :) will be converted to 🙂"
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title="Send comments on..."
                  description="Choose which key press is used to submit comments"
                  trailing={<SelectMenu options={['⌘+Enter', 'Enter']} />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Interface and theme">
            <SettingsCard>
               <SettingsRow
                  title="App sidebar"
                  description="Customize sidebar item visibility, ordering, and badge style"
                  trailing={
                     <Button size="xs" variant="ghost" onClick={() => setCustomizeOpen(true)}>
                        Customize
                     </Button>
                  }
               />
               <SettingsRow
                  title="Font size"
                  description="Adjust the size of text across the app"
                  trailing={<SelectMenu options={['Default', 'Small', 'Large']} />}
               />
               <SettingsRow
                  title="Use pointer cursors"
                  description="Change the cursor to a pointer when hovering over any interactive elements"
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title="Underline links"
                  description="Always underline links in text content"
                  trailing={<Switch />}
               />
            </SettingsCard>
            <ThemePreferences />
         </SettingsSection>

         <SettingsSection title="Desktop application">
            <SettingsCard>
               <SettingsRow
                  title="Open in desktop app"
                  description="Automatically open links in desktop app when possible"
                  trailing={<Switch />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Automations and workflows">
            <SettingsCard>
               <SettingsRow
                  title="Auto-assign to self"
                  description="When creating new issues, always assign them to yourself by default"
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title="On move to started status, assign to yourself"
                  description="When you move an unassigned issue to started, it will be automatically assigned to you"
                  trailing={<Switch defaultChecked />}
               />
            </SettingsCard>
         </SettingsSection>
         <CustomizeSidebarDialog open={customizeOpen} onOpenChange={setCustomizeOpen} />
      </SettingsShell>
   );
}
