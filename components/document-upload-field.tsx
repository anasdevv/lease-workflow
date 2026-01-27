import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import type { DocumentType, UploadedDocumentUI } from '@/types';
import { ACCEPTED_FILE_TYPES } from '@/constants/documents';

interface DocumentUploadFieldProps {
  documentType: DocumentType;
  uploadedDocument?: UploadedDocumentUI;
  isUploading: boolean;
  onUpload: (file: File, documentType: string) => Promise<void>;
  onRemove: (docId: string) => void;
}

export function DocumentUploadField({
  documentType,
  uploadedDocument,
  isUploading,
  onUpload,
  onRemove,
}: DocumentUploadFieldProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await onUpload(file, documentType.label);
    // Reset input to allow re-uploading the same file
    e.target.value = '';
  };

  const acceptedTypes = Object.values(ACCEPTED_FILE_TYPES).flat().join(',');

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">
          {documentType.label}{' '}
          {documentType.required && <span className="text-red-500">*</span>}
        </Label>
        {uploadedDocument && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(uploadedDocument.id)}
            className="text-red-500 hover:text-red-700 h-7"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!uploadedDocument ? (
        <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
          <div className="flex items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-sm text-slate-500">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">Click to upload</span>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept={acceptedTypes}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {uploadedDocument.filename}
            </p>
            <p className="text-xs text-green-600">
              Uploaded successfully • {(uploadedDocument.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}