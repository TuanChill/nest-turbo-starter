'use client';

import * as React from 'react';
import { ExternalLink, FileText, Loader2, Paperclip, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QueryErrorState from '@/components/common/query-error-state';
import { useAttachments, useUploadAttachment } from '@/hooks/queries/use-uploads-query';
import { MAX_ATTACHMENT_SIZE, type UploadTarget, uploadsService } from '@/services/uploads.service';
import { toast } from 'sonner';

function formatFileSize(bytes: number) {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCreatedAt(value: string) {
   const date = new Date(value);
   if (Number.isNaN(date.getTime())) return 'Unknown date';
   return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

interface FileAttachmentsProps {
   target: UploadTarget;
}

export function FileAttachments({ target }: FileAttachmentsProps) {
   const inputRef = React.useRef<HTMLInputElement>(null);
   const [fileError, setFileError] = React.useState<string | null>(null);
   const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
   const { data: attachments = [], isLoading, isError, error, refetch } = useAttachments(target);
   const uploadMutation = useUploadAttachment();

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      if (file.size > MAX_ATTACHMENT_SIZE) {
         setFileError('Files must be 25 MB or smaller');
         uploadMutation.reset();
         return;
      }

      setFileError(null);
      uploadMutation.mutate({ target, file });
   };

   const openAttachment = async (id: string) => {
      setDownloadingId(id);
      try {
         const downloadUrl = await uploadsService.getDownloadUrl(id);
         window.location.assign(downloadUrl);
      } catch (downloadError) {
         toast.error(
            downloadError instanceof Error ? downloadError.message : 'Failed to open attachment'
         );
      } finally {
         setDownloadingId(null);
      }
   };

   return (
      <section className="mt-8 border-t border-border/60 pt-6" aria-labelledby="attachments-title">
         <div className="flex items-center justify-between gap-3">
            <div>
               <h2 id="attachments-title" className="text-sm font-medium">
                  Attachments
               </h2>
               <p className="mt-1 text-xs text-muted-foreground">Files up to 25 MB</p>
            </div>
            <>
               <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadMutation.isPending}
               />
               <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={uploadMutation.isPending}
                  onClick={() => inputRef.current?.click()}
               >
                  {uploadMutation.isPending ? (
                     <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                     <Paperclip className="size-3.5" />
                  )}
                  {uploadMutation.isPending ? 'Uploading…' : 'Attach file'}
               </Button>
            </>
         </div>

         {isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
               <Loader2 className="size-3.5 animate-spin" />
               Loading attachments…
            </div>
         ) : isError ? (
            <div className="mt-4">
               <QueryErrorState
                  subject="attachments"
                  error={error}
                  onRetry={() => void refetch()}
               />
            </div>
         ) : attachments.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-border/70 px-4 py-5 text-center text-xs text-muted-foreground">
               No attachments yet.
            </div>
         ) : (
            <ul className="mt-4 divide-y divide-border/60 rounded-md border border-border/70">
               {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center gap-3 px-3 py-2.5">
                     <FileText className="size-4 shrink-0 text-muted-foreground" />
                     <div className="min-w-0 flex-1">
                        <button
                           type="button"
                           onClick={() => void openAttachment(attachment.id)}
                           disabled={downloadingId === attachment.id}
                           className="block max-w-full truncate text-left text-sm font-medium hover:underline disabled:opacity-60"
                        >
                           {attachment.fileName}
                        </button>
                        <p className="text-xs text-muted-foreground">
                           {formatFileSize(attachment.fileSize)} ·{' '}
                           {formatCreatedAt(attachment.createdAt)}
                        </p>
                     </div>
                     <button
                        type="button"
                        onClick={() => void openAttachment(attachment.id)}
                        disabled={downloadingId === attachment.id}
                        aria-label={`Open ${attachment.fileName}`}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                     >
                        {downloadingId === attachment.id ? (
                           <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                           <ExternalLink className="size-3.5" />
                        )}
                     </button>
                  </li>
               ))}
            </ul>
         )}

         {(uploadMutation.isError || fileError) && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
               <span>{fileError ?? 'Upload failed. Nothing was added to this issue.'}</span>
               <Button
                  type="button"
                  size="xxs"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                     setFileError(null);
                     uploadMutation.reset();
                  }}
               >
                  <RefreshCw className="size-3" />
                  Dismiss
               </Button>
            </div>
         )}
      </section>
   );
}
