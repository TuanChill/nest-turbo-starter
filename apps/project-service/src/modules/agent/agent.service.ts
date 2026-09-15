import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentChatDto } from './dto/agent.dto';

const CANNED_REPLIES = [
  {
    keywords: ['project', 'create', 'scope'],
    reply: `Here's a well-scoped draft based on your idea:

**Project — Docs command palette**
A ⌘K palette for the documentation site: fuzzy search across components, props and guides, with recent items and keyboard-first navigation.

**Suggested milestones**
1. Search index built from the docs content (1 week)
2. Palette UI on the shared Dialog primitive (1 week)
3. Recents, shortcuts and analytics (3 days)

**Suggested issues** — 6 issues across LNDev Core, lead **leonel.ngoya**, target date in 3 weeks.`,
  },
  {
    keywords: ['research', 'combobox', 'accessibility', 'a11y', 'bug'],
    reply: `I searched the issue backlog for combobox and accessibility mentions:

**Found 3 active issues:**
- **LNUI-701** (In progress): *Combobox: keyboard selection skips disabled options inconsistently* — assigned to **leonel.ngoya** in Cycle 21.
- **LNUI-713** (Done): *Add aria-activedescendant to Combobox virtual list*
- **LNUI-742** (Backlog): *Touch targets in Combobox popover below 44px on mobile*

**Summary:** The core pattern is solid; remaining work centers on edge cases in keyboard navigation when options are dynamically disabled.`,
  },
  {
    keywords: ['loop', 'automated', 'triage', 'weekly'],
    reply: `**Weekly triage loop — Core team draft**

**Schedule:** Every Monday at 09:00 UTC
**Scope:** Issues in *Triage* status with team **LNDev Core**

**Actions executed on run:**
1. Group unassigned triage issues by component label.
2. Flag issues without reproduction steps (> 7 days old).
3. Post a digest to **#core-team** with direct links to the top 5 urgent items.

Would you like me to activate this loop for the workspace?`,
  },
];

@Injectable()
export class AgentService {
  constructor(private readonly configService: ConfigService) {}

  async chat(dto: AgentChatDto) {
    if (this.configService.get<string>('appCommon.nodeEnv') === 'production') {
      throw new NotImplementedException(
        'Workspace agent integration is not configured for production',
      );
    }

    const input = dto.message.toLowerCase();
    const matched = CANNED_REPLIES.find((c) =>
      c.keywords.some((kw) => input.includes(kw)),
    );

    const reply =
      matched?.reply ||
      `I analyzed your request: "${dto.message}".\n\nI can help you create issues, draft projects, or summarize team progress across the workspace. Let me know what specific action you'd like to take.`;

    const title = dto.message.length > 36 ? dto.message.slice(0, 36) + '…' : dto.message;

    return {
      title,
      reply,
    };
  }

  getExamples() {
    if (this.configService.get<string>('appCommon.nodeEnv') === 'production') {
      throw new NotImplementedException(
        'Workspace agent integration is not configured for production',
      );
    }

    return [
      {
        id: 'create-project',
        icon: 'Box',
        title: 'Create a new project',
        description: 'Turn an idea into a well-scoped project',
        prompt: 'Create a project to ship a command palette for the docs site',
      },
      {
        id: 'research-topic',
        icon: 'Search',
        title: 'Research a topic',
        description: 'Research a topic across the issue backlog',
        prompt: 'What do we know about combobox accessibility issues?',
      },
      {
        id: 'automated-loop',
        icon: 'Workflow',
        title: 'Create automated loop',
        description: 'Learn what loops can do and create your first one',
        prompt: 'Help me set up a weekly triage loop for the Core team',
      },
    ];
  }
}
