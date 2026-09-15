import type { ContentBlock } from '@/mock-data/issue-details';

const HEADING_PATTERN = /^(#{1,4})\s+(.+)$/;
const CHECKLIST_PATTERN = /^[-*+]\s+\[([ xX])\]\s+(.+)$/;
const BULLET_PATTERN = /^[-*+]\s+(.+)$/;
const NUMBERED_PATTERN = /^\d+[.)]\s+(.+)$/;
const QUOTE_PATTERN = /^>\s?(.*)$/;
const DIVIDER_PATTERN = /^\s*(?:---+|\*\*\*+|___+)\s*$/;

function isBlockStart(line: string): boolean {
   return (
      HEADING_PATTERN.test(line) ||
      CHECKLIST_PATTERN.test(line) ||
      BULLET_PATTERN.test(line) ||
      NUMBERED_PATTERN.test(line) ||
      QUOTE_PATTERN.test(line) ||
      DIVIDER_PATTERN.test(line) ||
      line.trimStart().startsWith('```')
   );
}

/**
 * Converts the Markdown emitted by LinearEditor into the legacy project's
 * structured block format used by the project-service API.
 */
export function markdownToContentBlocks(markdown: string): ContentBlock[] {
   const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
   const blocks: ContentBlock[] = [];
   let paragraph: string[] = [];

   const flushParagraph = () => {
      const text = paragraph.join('\n').trim();
      if (text) blocks.push({ type: 'paragraph', text });
      paragraph = [];
   };

   for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (line.trim() === '') {
         flushParagraph();
         continue;
      }

      const fence = line.trim().match(/^```\s*(.*)$/);
      if (fence) {
         flushParagraph();
         const codeLines: string[] = [];
         index += 1;
         while (index < lines.length && !lines[index].trim().startsWith('```')) {
            codeLines.push(lines[index]);
            index += 1;
         }
         blocks.push({ type: 'code', language: fence[1], code: codeLines.join('\n') });
         continue;
      }

      const heading = line.match(HEADING_PATTERN);
      if (heading) {
         flushParagraph();
         blocks.push({
            type: 'heading',
            level: heading[1].length as 1 | 2 | 3 | 4,
            text: heading[2].trim(),
         });
         continue;
      }

      if (DIVIDER_PATTERN.test(line)) {
         flushParagraph();
         blocks.push({ type: 'divider' });
         continue;
      }

      if (CHECKLIST_PATTERN.test(line)) {
         flushParagraph();
         const items: { text: string; checked: boolean }[] = [];
         while (index < lines.length) {
            const item = lines[index].match(CHECKLIST_PATTERN);
            if (!item) break;
            items.push({ text: item[2].trim(), checked: item[1].toLowerCase() === 'x' });
            index += 1;
         }
         index -= 1;
         blocks.push({ type: 'checklist', items });
         continue;
      }

      if (BULLET_PATTERN.test(line)) {
         flushParagraph();
         const items: string[] = [];
         while (index < lines.length) {
            const item = lines[index].match(BULLET_PATTERN);
            if (!item || CHECKLIST_PATTERN.test(lines[index])) break;
            items.push(item[1].trim());
            index += 1;
         }
         index -= 1;
         blocks.push({ type: 'bullet-list', items });
         continue;
      }

      if (NUMBERED_PATTERN.test(line)) {
         flushParagraph();
         const items: string[] = [];
         while (index < lines.length) {
            const item = lines[index].match(NUMBERED_PATTERN);
            if (!item) break;
            items.push(item[1].trim());
            index += 1;
         }
         index -= 1;
         blocks.push({ type: 'numbered-list', items });
         continue;
      }

      if (QUOTE_PATTERN.test(line)) {
         flushParagraph();
         const quoteLines: string[] = [];
         while (index < lines.length) {
            const quote = lines[index].match(QUOTE_PATTERN);
            if (!quote) break;
            quoteLines.push(quote[1]);
            index += 1;
         }
         index -= 1;
         blocks.push({ type: 'quote', text: quoteLines.join('\n') });
         continue;
      }

      // Keep ordinary lines together as one paragraph. `isBlockStart` is used
      // here to make the intent explicit when this parser is extended with
      // additional block syntaxes.
      if (!isBlockStart(line)) paragraph.push(line);
   }

   flushParagraph();
   return blocks;
}
