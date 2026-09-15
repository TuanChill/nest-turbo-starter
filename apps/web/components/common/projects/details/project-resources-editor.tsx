'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUpdateProject } from '@/hooks/queries/use-projects-query';
import type { ProjectResource } from '@/mock-data/project-details';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

interface ProjectResourcesEditorProps {
   projectId: string;
   resources: ProjectResource[];
}

export function ProjectResourcesEditor({ projectId, resources }: ProjectResourcesEditorProps) {
   const [open, setOpen] = useState(false);
   const [label, setLabel] = useState('');
   const [url, setUrl] = useState('');
   const updateProject = useUpdateProject();

   const saveResources = async (nextResources: ProjectResource[]) => {
      await updateProject.mutateAsync({
         id: projectId,
         payload: { resources: nextResources } as unknown as Partial<
            import('@/mock-data/projects').Project
         >,
      });
   };

   const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedLabel = label.trim();
      const trimmedUrl = url.trim();
      if (!trimmedLabel || !trimmedUrl) {
         toast.error('Resource name and URL are required');
         return;
      }
      try {
         const parsed = new URL(trimmedUrl);
         if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only HTTP(S) resource URLs are supported');
         }
         await saveResources([...resources, { label: trimmedLabel, url: trimmedUrl }]);
         setLabel('');
         setUrl('');
         setOpen(false);
      } catch (error) {
         toast.error(error instanceof Error ? error.message : 'Could not add resource');
      }
   };

   const handleRemove = async (index: number) => {
      try {
         await saveResources(resources.filter((_, resourceIndex) => resourceIndex !== index));
      } catch {
         // The mutation hook surfaces the API error; keep the editor open for retry.
      }
   };

   return (
      <>
         <div className="flex items-center gap-2 flex-wrap">
            {resources.map((resource, index) => (
               <div
                  key={`${resource.url}-${index}`}
                  className="inline-flex items-center gap-1.5 text-xs border rounded-md px-2 py-1"
               >
                  <a
                     href={resource.url}
                     target="_blank"
                     rel="noreferrer"
                     className="inline-flex items-center gap-1.5 hover:underline"
                  >
                     {resource.label}
                  </a>
                  <button
                     type="button"
                     aria-label={`Remove ${resource.label}`}
                     title={`Remove ${resource.label}`}
                     className="text-muted-foreground hover:text-destructive"
                     onClick={() => void handleRemove(index)}
                     disabled={updateProject.isPending}
                  >
                     <Trash2 className="size-3" />
                  </button>
               </div>
            ))}
            <Button
               type="button"
               variant="ghost"
               size="icon"
               className="size-7"
               aria-label="Add project resource"
               title="Add project resource"
               onClick={() => setOpen(true)}
               disabled={updateProject.isPending}
            >
               <Plus className="size-3.5" />
            </Button>
         </div>

         <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
               <form onSubmit={handleAdd}>
                  <DialogHeader>
                     <DialogTitle>Add project resource</DialogTitle>
                     <DialogDescription>
                        Save a link to a document, design, dashboard, or other project resource.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                     <Input
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Resource name"
                        autoFocus
                        disabled={updateProject.isPending}
                     />
                     <Input
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://example.com"
                        type="url"
                        disabled={updateProject.isPending}
                     />
                  </div>
                  <DialogFooter>
                     <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                     </Button>
                     <Button type="submit" disabled={updateProject.isPending}>
                        {updateProject.isPending && <Loader2 className="size-3.5 animate-spin" />}
                        Add resource
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
      </>
   );
}
