import { ContentBlock } from '@/mock-data/issue-details';

/**
 * Converts legacy/seed ContentBlock[] or mixed strings into clean Markdown
 * for use in TipTap editor.
 */
export function contentBlocksToMarkdown(blocks?: ContentBlock[] | string | null): string {
   if (!blocks) return '';
   if (typeof blocks === 'string') return blocks;
   if (!Array.isArray(blocks)) return '';

   const normalized = blocks.flat(Infinity).filter(Boolean) as (ContentBlock | string)[];

   const lines: string[] = [];

   for (const block of normalized) {
      if (typeof block === 'string') {
         lines.push(block);
         continue;
      }

      switch (block.type) {
         case 'heading': {
            const prefix = block.level === 2 ? '##' : '#';
            lines.push(`${prefix} ${block.text}`);
            break;
         }
         case 'paragraph': {
            lines.push(block.text);
            break;
         }
         case 'bullet-list': {
            for (const item of block.items) {
               lines.push(`- ${item}`);
            }
            break;
         }
         case 'numbered-list': {
            block.items.forEach((item, index) => {
               lines.push(`${index + 1}. ${item}`);
            });
            break;
         }
         case 'checklist': {
            for (const item of block.items) {
               lines.push(`- [${item.checked ? 'x' : ' '}] ${item.text}`);
            }
            break;
         }
         case 'code': {
            lines.push(`\`\`\`${block.language || ''}\n${block.code}\n\`\`\``);
            break;
         }
         case 'quote': {
            const author = block.author ? ` — *${block.author}*` : '';
            lines.push(`> ${block.text}${author}`);
            break;
         }
         case 'divider': {
            lines.push('---');
            break;
         }
         case 'issue-ref': {
            const note = block.note ? ` — ${block.note}` : '';
            lines.push(`- **${block.identifier}**${note}`);
            break;
         }
         case 'image': {
            lines.push(`![${block.alt}](${block.caption || block.alt})`);
            break;
         }
         case 'video': {
            lines.push(
               `> 📹 **Video:** ${block.title}${block.duration ? ` (${block.duration})` : ''}`
            );
            break;
         }
         default:
            break;
      }
   }

   return lines.join('\n\n');
}
