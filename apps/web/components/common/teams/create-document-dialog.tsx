'use client';

import * as React from 'react';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import {
   useDocuments,
   useCreateDocument,
   useCreateDocumentFolder,
} from '@/hooks/queries/use-documents-query';
import { FolderPlus, Loader2, Pin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface CreateDocumentDialogProps {
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   defaultFolderId?: string;
}

const DOCUMENT_EMOJIS = [
   '📄',
   '📆',
   '🎨',
   '📐',
   '🧪',
   '🔗',
   '🗂️',
   '✅',
   '🎯',
   '📚',
   '✍️',
   '🚀',
   '📋',
   '🏷️',
   '🛠️',
   '💡',
];

export function CreateDocumentDialog({
   trigger,
   open: controlledOpen,
   onOpenChange: setControlledOpen,
   defaultFolderId,
}: CreateDocumentDialogProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

   const { teamId } = useParams<{ teamId?: string }>();
   const { data: folders = [] } = useDocuments();
   const createDocumentMutation = useCreateDocument();
   const createFolderMutation = useCreateDocumentFolder();

   const [name, setName] = React.useState('');
   const [selectedIcon, setSelectedIcon] = React.useState('📄');
   const [folderId, setFolderId] = React.useState(defaultFolderId || folders[0]?.id || '');
   const [isCreatingNewFolder, setIsCreatingNewFolder] = React.useState(false);
   const [newFolderName, setNewFolderName] = React.useState('');
   const [isPinned, setIsPinned] = React.useState(false);
   const [content, setContent] = React.useState('');
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   // Sync default folder
   React.useEffect(() => {
      if (defaultFolderId) setFolderId(defaultFolderId);
      else if (folders.length > 0 && !folderId) setFolderId(folders[0].id);
   }, [defaultFolderId, folders, folderId]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
         toast.error('Please enter a document name');
         return;
      }

      setIsSubmitting(true);
      try {
         let targetFolderId = folderId;

         // If creating new folder inline
         if (isCreatingNewFolder) {
            const trimmedFolderName = newFolderName.trim();
            if (!trimmedFolderName) {
               toast.error('Please enter a folder name');
               setIsSubmitting(false);
               return;
            }
            const folder = await createFolderMutation.mutateAsync({
               name: trimmedFolderName,
               icon: '📁',
               teamId: teamId || 'CORE',
            });
            targetFolderId = folder.id;
         } else if (!targetFolderId) {
            // No folders exist yet for this team — create a default one transparently.
            const folder = await createFolderMutation.mutateAsync({
               name: 'General',
               icon: '📁',
               teamId: teamId || 'CORE',
            });
            targetFolderId = folder.id;
         }

         const docId = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
         await createDocumentMutation.mutateAsync({
            id: docId,
            name: trimmedName,
            icon: selectedIcon,
            pinned: isPinned,
            content: content.trim() || undefined,
            folderId: targetFolderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
         });

         toast.success(`Document "${trimmedName}" created successfully`);
         setName('');
         setContent('');
         setIsPinned(false);
         setIsCreatingNewFolder(false);
         setNewFolderName('');
         setOpen(false);
      } catch (err: unknown) {
         console.error('Failed to create document:', err);
         const errorMessage = err instanceof Error ? err.message : 'Could not create document';
         toast.error(errorMessage);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         {trigger ? (
            <DialogTrigger asChild>{trigger}</DialogTrigger>
         ) : (
            <DialogTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <Plus className="size-4 md:mr-1" />
                  <span className="hidden md:inline">New document</span>
               </Button>
            </DialogTrigger>
         )}
         <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-container border-border/60">
            <form onSubmit={handleSubmit}>
               <DialogHeader className="p-5 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                     <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {selectedIcon}
                     </div>
                     <div>
                        <DialogTitle className="text-base font-semibold">
                           Create new document
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                           Documents capture specs, RFCs, release notes, and team documentation.
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>

               <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Folder selector / Creator */}
                  <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Folder</Label>
                        <button
                           type="button"
                           onClick={() => setIsCreatingNewFolder((v) => !v)}
                           className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                           <FolderPlus className="size-3" />
                           {isCreatingNewFolder ? 'Choose existing folder' : '+ New folder'}
                        </button>
                     </div>

                     {isCreatingNewFolder ? (
                        <div className="flex items-center gap-2">
                           <Input
                              placeholder="e.g. Architecture Specs"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              disabled={isSubmitting}
                              autoFocus
                              className="h-8 text-xs"
                           />
                        </div>
                     ) : (
                        <Select
                           value={folderId}
                           onValueChange={setFolderId}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select folder" />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              {folders.map((f) => (
                                 <SelectItem key={f.id} value={f.id} className="text-xs">
                                    <div className="flex items-center gap-2">
                                       <span>{f.icon}</span>
                                       <span>{f.name}</span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     )}
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                     <Label htmlFor="doc-title" className="text-xs font-medium">
                        Title <span className="text-destructive">*</span>
                     </Label>
                     <Input
                        id="doc-title"
                        placeholder="e.g. Design Tokens & Theme Specification"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        autoFocus={!isCreatingNewFolder}
                        className="h-9 text-sm"
                     />
                  </div>

                  {/* Icon grid */}
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium">Icon</Label>
                     <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/40 bg-background/50">
                        {DOCUMENT_EMOJIS.map((emoji) => (
                           <button
                              key={emoji}
                              type="button"
                              onClick={() => setSelectedIcon(emoji)}
                              className={cn(
                                 'size-8 rounded-md flex items-center justify-center text-base transition-all',
                                 selectedIcon === emoji
                                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                                    : 'hover:bg-sidebar/80'
                              )}
                           >
                              {emoji}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Pin switch */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/40">
                     <div className="flex items-center gap-2">
                        <Pin className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">Pin to top of folder</span>
                     </div>
                     <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded border-border cursor-pointer"
                     />
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5">
                     <Label htmlFor="doc-content" className="text-xs font-medium">
                        Content (Markdown)
                     </Label>
                     <Textarea
                        id="doc-content"
                        placeholder="Write or paste your markdown notes here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isSubmitting}
                        rows={4}
                        className="text-xs resize-none font-mono"
                     />
                  </div>
               </div>

               <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2">
                  <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => setOpen(false)}
                     disabled={isSubmitting}
                     className="h-8 text-xs"
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     size="sm"
                     disabled={isSubmitting || !name.trim()}
                     className="h-8 text-xs gap-1.5"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="size-3.5 animate-spin" />
                           Creating...
                        </>
                     ) : (
                        'Create document'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
