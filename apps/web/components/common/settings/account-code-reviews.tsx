import SettingsPlaceholder from './settings-placeholder';

/**
 * Code-review controls require a real repository/provider contract and must
 * not render invented diffs or inert switches.
 */
export default function AccountCodeReviews() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'Code & reviews',
            description: 'Repository review integrations are not configured in this deployment.',
            emptyLabel: 'Code reviews unavailable',
         }}
      />
   );
}
