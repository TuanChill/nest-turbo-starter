import { Editor, Extension, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import {
   CheckSquare,
   Code,
   Heading1,
   Heading2,
   Heading3,
   List,
   ListOrdered,
   Minus,
   Quote,
   Type,
   type LucideIcon,
} from 'lucide-react';

export interface CommandItem {
   title: string;
   description: string;
   icon: LucideIcon;
   searchTerms?: string[];
   command: (params: { editor: Editor; range: Range }) => void;
}

export const SLASH_COMMAND_ITEMS: CommandItem[] = [
   {
      title: 'Text',
      description: 'Plain text paragraph',
      icon: Type,
      searchTerms: ['p', 'paragraph', 'normal'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).setParagraph().run();
      },
   },
   {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: Heading1,
      searchTerms: ['h1', 'title', 'header', 'large'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
      },
   },
   {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2,
      searchTerms: ['h2', 'subtitle', 'header', 'medium'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
   },
   {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: Heading3,
      searchTerms: ['h3', 'subheading', 'header', 'small'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
      },
   },
   {
      title: 'To-do list',
      description: 'Track tasks with checklist',
      icon: CheckSquare,
      searchTerms: ['todo', 'task', 'checklist', 'checkbox', 'check'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
   },
   {
      title: 'Bullet list',
      description: 'Create a simple bulleted list',
      icon: List,
      searchTerms: ['ul', 'unordered', 'point'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
   },
   {
      title: 'Numbered list',
      description: 'Create a list with numbering',
      icon: ListOrdered,
      searchTerms: ['ol', 'ordered', 'count'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
   },
   {
      title: 'Code block',
      description: 'Code snippet with formatting',
      icon: Code,
      searchTerms: ['codeblock', 'pre', 'snippet', 'code'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
   },
   {
      title: 'Quote',
      description: 'Capture a blockquote',
      icon: Quote,
      searchTerms: ['blockquote', 'cite'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
   },
   {
      title: 'Divider',
      description: 'Visually separate sections',
      icon: Minus,
      searchTerms: ['hr', 'rule', 'line', 'separator'],
      command: ({ editor, range }) => {
         editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
   },
];

export interface SlashCommandState {
   isOpen: boolean;
   query: string;
   range: Range | null;
   clientRect: (() => DOMRect | null) | null;
   command: ((item: CommandItem) => void) | null;
}

export const createSlashCommandExtension = (
   onStateChange: (state: SlashCommandState) => void,
   onKeyDownRef: React.MutableRefObject<((event: KeyboardEvent) => boolean) | null>
) => {
   return Extension.create({
      name: 'slashCommands',

      addProseMirrorPlugins() {
         return [
            Suggestion({
               editor: this.editor,
               char: '/',
               startOfLine: false,
               command: ({ editor, range, props }) => {
                  props.command({ editor, range });
               },
               render: () => {
                  return {
                     onStart: (props) => {
                        onStateChange({
                           isOpen: true,
                           query: props.query,
                           range: props.range,
                           clientRect: props.clientRect || null,
                           command: (item: CommandItem) => props.command(item),
                        });
                     },
                     onUpdate: (props) => {
                        onStateChange({
                           isOpen: true,
                           query: props.query,
                           range: props.range,
                           clientRect: props.clientRect || null,
                           command: (item: CommandItem) => props.command(item),
                        });
                     },
                     onKeyDown: (props) => {
                        if (onKeyDownRef.current) {
                           return onKeyDownRef.current(props.event);
                        }
                        return false;
                     },
                     onExit: () => {
                        onStateChange({
                           isOpen: false,
                           query: '',
                           range: null,
                           clientRect: null,
                           command: null,
                        });
                     },
                  };
               },
            }),
         ];
      },
   });
};
