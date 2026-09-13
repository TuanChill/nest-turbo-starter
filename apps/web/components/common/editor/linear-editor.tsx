'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { cn } from '@/lib/utils';
import { createSlashCommandExtension, SlashCommandState } from './slash-command';
import { SlashCommandMenu } from './slash-command-menu';
import { LinearBubbleMenu } from './linear-bubble-menu';

export interface LinearEditorProps {
   value?: string;
   onChange?: (markdown: string) => void;
   onBlur?: (markdown: string) => void;
   onSave?: (markdown: string) => void;
   autoSaveDelay?: number;
   placeholder?: string;
   editable?: boolean;
   autoFocus?: boolean;
   className?: string;
   minHeight?: string;
}

export function LinearEditor({
   value = '',
   onChange,
   onBlur,
   onSave,
   autoSaveDelay = 1000,
   placeholder = "Add description or type '/' for commands...",
   editable = true,
   autoFocus = false,
   className,
   minHeight = 'min-h-[70px]',
}: LinearEditorProps) {
   const [isMounted, setIsMounted] = React.useState(false);
   const [slashState, setSlashState] = React.useState<SlashCommandState>({
      isOpen: false,
      query: '',
      range: null,
      clientRect: null,
      command: null,
   });

   const onKeyDownRef = React.useRef<((event: KeyboardEvent) => boolean) | null>(null);
   const lastReportedValue = React.useRef<string>(value);
   const lastSavedValue = React.useRef<string>(value);
   const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

   const triggerSave = React.useCallback(
      (md: string) => {
         if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
         }
         if (md !== lastSavedValue.current) {
            lastSavedValue.current = md;
            onSave?.(md);
         }
      },
      [onSave]
   );

   const scheduleSave = React.useCallback(
      (md: string) => {
         if (!onSave) return;
         if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
         }
         saveTimeoutRef.current = setTimeout(() => {
            triggerSave(md);
         }, autoSaveDelay);
      },
      [onSave, triggerSave, autoSaveDelay]
   );

   React.useEffect(() => {
      return () => {
         if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
         }
      };
   }, []);

   React.useEffect(() => {
      setIsMounted(true);
   }, []);

   const slashCommandExt = React.useMemo(() => {
      return createSlashCommandExtension(setSlashState, onKeyDownRef);
   }, []);

   const editor = useEditor(
      {
         extensions: [
            StarterKit.configure({
               heading: {
                  levels: [1, 2, 3],
               },
               codeBlock: {
                  HTMLAttributes: {
                     class: 'rounded-lg border border-border/60 bg-muted/40 p-4 font-mono text-[13px] leading-6',
                  },
               },
            }),
            Placeholder.configure({
               placeholder,
               emptyEditorClass: 'is-editor-empty',
            }),
            TaskList.configure({
               HTMLAttributes: {
                  class: 'taskList',
               },
            }),
            TaskItem.configure({
               nested: true,
               HTMLAttributes: {
                  class: 'taskItem',
               },
            }),
            Link.configure({
               openOnClick: false,
               autolink: true,
               HTMLAttributes: {
                  class: 'text-primary underline underline-offset-4 cursor-pointer hover:text-primary/80',
               },
            }),
            Markdown.configure({
               html: true,
               tightLists: true,
               bulletListMarker: '-',
            }),
            slashCommandExt,
         ],
         content: value,
         editable,
         autofocus: autoFocus ? 'end' : false,
         editorProps: {
            attributes: {
               class: cn(
                  'focus:outline-none w-full text-[15px] leading-7 text-foreground',
                  minHeight
               ),
            },
            handleKeyDown: (view, event) => {
               // Let slash command handle keydown first if open
               if (slashState.isOpen && onKeyDownRef.current) {
                  const handled = onKeyDownRef.current(event);
                  if (handled) return true;
               }

               // Cmd+Enter or Ctrl+Enter to commit / blur
               if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  view.dom.blur();
                  return true;
               }

               // Escape key blurs editor when menu is closed
               if (event.key === 'Escape' && !slashState.isOpen) {
                  event.preventDefault();
                  view.dom.blur();
                  return true;
               }

               return false;
            },
         },
         onUpdate: ({ editor: ed }) => {
            const md =
               (
                  ed.storage as { markdown?: { getMarkdown: () => string } }
               ).markdown?.getMarkdown() ?? '';
            lastReportedValue.current = md;
            onChange?.(md);
            scheduleSave(md);
         },
         onBlur: ({ editor: ed }) => {
            const md =
               (
                  ed.storage as { markdown?: { getMarkdown: () => string } }
               ).markdown?.getMarkdown() ?? '';
            lastReportedValue.current = md;
            onBlur?.(md);
            triggerSave(md);
         },
      },
      [isMounted, scheduleSave, triggerSave]
   );

   // Sync value if changed from outside
   React.useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      if (value !== lastReportedValue.current) {
         lastReportedValue.current = value;
         lastSavedValue.current = value;
         editor.commands.setContent(value, { emitUpdate: false });
      }
   }, [editor, value]);

   // Sync editable state
   React.useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      if (editor.isEditable !== editable) {
         editor.setEditable(editable);
      }
   }, [editor, editable]);

   const closeSlashMenu = React.useCallback(() => {
      setSlashState({
         isOpen: false,
         query: '',
         range: null,
         clientRect: null,
         command: null,
      });
   }, []);

   if (!isMounted) {
      return (
         <div
            className={cn(
               'w-full py-1 text-[15px] leading-7 text-muted-foreground/60',
               minHeight,
               className
            )}
         >
            {value ? (
               <div className="whitespace-pre-wrap font-sans opacity-70">{value}</div>
            ) : (
               <p className="opacity-50">{placeholder}</p>
            )}
         </div>
      );
   }

   return (
      <div
         className={cn('relative w-full linear-tiptap-editor cursor-text', className)}
         onClick={() => {
            if (editor && !editor.isFocused && editable) {
               editor.commands.focus();
            }
         }}
      >
         <EditorContent editor={editor} />
         <SlashCommandMenu
            state={slashState}
            onClose={closeSlashMenu}
            onKeyDownRef={onKeyDownRef}
         />
         {editable && <LinearBubbleMenu editor={editor} />}
      </div>
   );
}
