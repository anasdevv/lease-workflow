import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';
import type { UploadedDocumentUI } from '@/types';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/constants/documents';

interface UseDocumentUploadReturn {
  documents: UploadedDocumentUI[];
  isUploading: boolean;
  uploadDocument: (file: File, documentType: string) => Promise<void>;
  removeDocument: (docId: string) => void;
  hasRequiredDocuments: (requiredTypes: string[]) => boolean;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [documents, setDocuments] = useState<UploadedDocumentUI[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return false;
    }

    // Check file type
    const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a PDF, JPG, or PNG file',
      });
      return false;
    }

    return true;
  };

  const uploadDocument = async (file: File, documentType: string): Promise<void> => {
    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      const newDocument: UploadedDocumentUI = {
        id: crypto.randomUUID(),
        documentType,
        filename: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      };

      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.documentType !== documentType);
        return [...filtered, newDocument];
      });

      toast.success('Document uploaded', {
        description: `${documentType} has been uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (docId: string): void => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.info('Document removed');
  };

  const hasRequiredDocuments = (requiredTypes: string[]): boolean => {
    return requiredTypes.every((type) =>
      documents.some((d) => d.documentType === type)
    );
  };

  return {
    documents,
    isUploading,
    uploadDocument,
    removeDocument,
    hasRequiredDocuments,
  };
}