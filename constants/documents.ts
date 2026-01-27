import type { DocumentType } from '@/types';

export const DOCUMENT_TYPES: DocumentType[] = [
  // { id: 'pay_stub', label: 'Pay Stub', required: true },
  // { id: 'tax_return', label: 'Tax Return', required: true },
  { id: 'id_verification', label: 'ID Verification', required: true },
] as const;

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const APPLICATION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const WORKFLOW_STATUSES = {
  RUNNING: 'running',
  PAUSED_FOR_REVIEW: 'paused_for_review',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const VERIFICATION_STATUSES = {
  PENDING: 'pending',
  EXTRACTED: 'extracted',
  VERIFIED: 'verified',
  FAILED: 'failed',
} as const;