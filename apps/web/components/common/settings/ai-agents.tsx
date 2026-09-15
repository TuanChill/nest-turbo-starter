'use client';

import SettingsPlaceholder from './settings-placeholder';

/** Workspace "AI & Agents" settings. */
export default function AiAgents() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'AI & Agents',
            description: 'Automate product development with connected AI services',
            emptyLabel: 'Not available in this deployment',
         }}
      />
   );
}
