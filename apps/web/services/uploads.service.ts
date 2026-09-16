import { apiClient } from './api-client';

export type UploadTarget =
   | { issueIdentifier: string; projectId?: never }
   | { projectId: string; issueIdentifier?: never };

export interface FileAttachment {
   id: string;
   workspaceId: string;
   teamId: string;
   issueIdentifier: string | null;
   projectId: string | null;
   uploaderId: string;
   fileName: string;
   contentType: string;
   fileSize: number;
   fileKey: string;
   fileUrl: string;
   status: 'pending' | 'completed';
   createdAt: string;
   completedAt: string | null;
}

interface PresignedUpload extends FileAttachment {
   uploadUrl: string;
}

export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

export function validateAttachment(file: File) {
   if (!file.name.trim()) {
      throw new Error('A file name is required');
   }
   if (file.size < 1) {
      throw new Error('Empty files cannot be uploaded');
   }
   if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error('Files must be 25 MB or smaller');
   }
}

export const uploadsService = {
   async getAttachments(target: UploadTarget): Promise<FileAttachment[]> {
      return apiClient<FileAttachment[]>('/uploads', { params: target });
   },

   async getDownloadUrl(id: string): Promise<string> {
      const result = await apiClient<{ downloadUrl: string }>(`/uploads/${id}/download`);
      return result.downloadUrl;
   },

   async upload(target: UploadTarget, file: File): Promise<FileAttachment> {
      validateAttachment(file);

      const presigned = await apiClient<PresignedUpload>('/uploads/presign', {
         method: 'POST',
         body: JSON.stringify({
            ...target,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            fileSize: file.size,
         }),
      });

      const uploadResponse = await fetch(presigned.uploadUrl, {
         method: 'PUT',
         headers: {
            'Content-Type': file.type || 'application/octet-stream',
         },
         body: file,
      });

      if (!uploadResponse.ok) {
         throw new Error(`File upload failed (${uploadResponse.status})`);
      }

      return apiClient<FileAttachment>(`/uploads/${presigned.id}/complete`, {
         method: 'POST',
      });
   },
};
