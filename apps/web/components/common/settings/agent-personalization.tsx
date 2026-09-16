'use client';

import SettingsPlaceholder from './settings-placeholder';

/** Agent preferences remain unavailable until guidance and connector records persist. */
export default function AgentPersonalization() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'Agent personalization',
            description:
               'Agent guidance, skills, and MCP connector settings are not configured in this deployment.',
            emptyLabel: 'Agent personalization unavailable',
         }}
      />
   );
}
