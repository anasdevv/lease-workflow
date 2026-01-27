import type { 
  Listing, 
  Application, 
  Document, 
  ApplicationDocument,
  HumanReviewDecision,
  Prisma 
} from '@/generated/prisma/client';

export type { 
  Listing, 
  Application, 
  Document, 
  ApplicationDocument,
  HumanReviewDecision 
};

export type ApplicationStatus = Application['status'];
export type WorkflowStatus = NonNullable<Application['workflowStatus']>;
export type DocumentStatus = Document['status'];
export type DocumentTypeId = ApplicationDocument['documentType'];
export type VerificationStatus = ApplicationDocument['verificationStatus'];
export type ReviewDecision = NonNullable<HumanReviewDecision['decision']>;
export type ReviewStatus = HumanReviewDecision['status'];

export interface ApplicationFormData {
  applicantName: string;
  applicantEmail: string;
  moveInDate: string;
}

export interface UploadedDocumentUI {
  id: string;
  documentType: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DocumentType {
  id: DocumentTypeId;
  label: string;
  required: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: {
    listing: true;
    documents: {
      include: {
        document: true;
      };
    };
    reviewDecisions: true;
  };
}>;

export type ApplicationDocumentWithRelations = Prisma.ApplicationDocumentGetPayload<{
  include: {
    document: true;
    application: true;
  };
}>;

export type CreateApplicationInput = Prisma.ApplicationCreateInput;
export type CreateDocumentInput = Prisma.DocumentCreateInput;
export type CreateApplicationDocumentInput = Prisma.ApplicationDocumentCreateInput;

export type UpdateApplicationInput = Prisma.ApplicationUpdateInput;
export type UpdateDocumentInput = Prisma.DocumentUpdateInput;

export type ApplicationWhereInput = Prisma.ApplicationWhereInput;
export type DocumentWhereInput = Prisma.DocumentWhereInput;
export type ListingWhereInput = Prisma.ListingWhereInput;