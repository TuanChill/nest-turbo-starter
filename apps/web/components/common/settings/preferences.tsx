'use client';

import { CustomizeSidebarDialog } from '@/components/layout/sidebar/customize-sidebar-dialog';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/queries';
import { getActiveWorkspace, saveActiveWorkspace } from '@/lib/utils/workspace-persistence';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell, SelectMenu } from './shared';
import { ThemePreferences } from './theme-preferences';

function UnavailablePreferences() {
   return (
      <div className="rounded-lg border border-dashed border-border/70 p-5">
         <p className="text-sm font-medium">Additional personal preferences are unavailable</p>
         <p className="mt-1 text-xs text-muted-foreground">
            Home view, display-name, editor, desktop, and automation preferences do not have a
            persisted backend contract in this deployment, so no local-only switches are shown.
         </p>
      </div>
   );
}

/** Personal settings backed by real client behavior; unsupported preferences stay explicit. */
export default function Preferences() {
   const [customizeOpen, setCustomizeOpen] = useState(false);
   const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
   const [defaultWorkspaceSlug, setDefaultWorkspaceSlug] = useState('');

   useEffect(() => {
      const saved = getActiveWorkspace();
      if (saved) setDefaultWorkspaceSlug(saved);
      else if (workspaces && workspaces.length > 0) setDefaultWorkspaceSlug(workspaces[0].slug);
   }, [workspaces]);

   const handleDefaultWorkspaceChange = (slug: string) => {
      setDefaultWorkspaceSlug(slug);
      saveActiveWorkspace(slug);
      const wsName = workspaces?.find((workspace) => workspace.slug === slug)?.name || slug;
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
                           options={workspaces.map((workspace) => ({
                              label: workspace.name,
                              value: workspace.slug,
                           }))}
                           onChange={handleDefaultWorkspaceChange}
                        />
                     ) : (
                        <span className="text-xs text-muted-foreground">No workspaces</span>
                     )
                  }
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
            </SettingsCard>
            <ThemePreferences />
         </SettingsSection>

         <SettingsSection title="Other preferences">
            <UnavailablePreferences />
         </SettingsSection>

         <CustomizeSidebarDialog open={customizeOpen} onOpenChange={setCustomizeOpen} />
      </SettingsShell>
   );
}
