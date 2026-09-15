/** Short chat title derived from the first user message. */
export function chatTitleFrom(input: string): string {
   const clean = input.trim().replace(/\s+/g, ' ');
   return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || 'New chat';
}
