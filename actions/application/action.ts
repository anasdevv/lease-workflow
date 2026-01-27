'use server';

import  prisma  from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { 
  ApplicationFormData, 
  UploadedDocumentUI, 
  DocumentTypeId,
  ApiResponse,
  Listing,
  Application
} from '@/types';

interface CreateApplicationInput {
  formData: ApplicationFormData;
  listingId: number;
  documents: UploadedDocumentUI[];
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<ApiResponse<Application>> {
  try {
    const { formData, listingId, documents } = input;
    
    const application = await prisma.$transaction(async (tx) => {
      // 1. Create the application
      const app = await tx.application.create({
        data: {
          applicantName: formData.applicantName,
          applicantEmail: formData.applicantEmail,
          listingId: listingId,
          status: 'submitted',
          workflowStatus: 'running',
        },
      });

      // 2. Create all documents at once
      const documentData = documents.map(doc => ({
        blobUrl: doc.fileUrl,
        filename: doc.filename,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: 'uploaded' as const,
      }));

      await tx.document.createMany({
        data: documentData,
      });

      // 3. Get the created documents to link them
      const createdDocuments = await tx.document.findMany({
        where: {
          blobUrl: { in: documents.map(d => d.fileUrl) },
        },
        orderBy: { createdAt: 'desc' },
        take: documents.length,
      });

      // 4. Map UI document type to Prisma enum
      const documentTypeMap: Record<string, DocumentTypeId> = {
        'Pay Stub': 'pay_stub',
        'Tax Return': 'tax_return',
        'ID Verification': 'id_verification',
      };

      // 5. Create all application-document links at once
      const applicationDocumentData = createdDocuments.map((doc, index) => ({
        applicationId: app.id,
        documentId: doc.id,
        documentType: documentTypeMap[documents[index].documentType] || 'id_verification',
        verificationStatus: 'pending' as const,
      }));

      await tx.applicationDocument.createMany({
        data: applicationDocumentData,
      });

      return app;
    });

    revalidatePath(`/listings/${listingId}`);
    revalidatePath(`/applications/${listingId}`);

    return {
      success: true,
      data: application,
    };
  } catch (error) {
    console.error('Failed to create application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create application',
    };
  }
}

export async function getListingById(id: number): Promise<ApiResponse<Listing>> {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return {
        success: false,
        error: 'Listing not found',
      };
    }

    return {
      success: true,
      data: listing,
    };
  } catch (error) {
    console.error('Failed to get listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get listing',
    };
  }
}

export async function getApplicationById(id: number): Promise<ApiResponse<Application>> {
  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        listing: true,
        documents: {
          include: {
            document: true,
          },
        },
        reviewDecisions: true,
      },
    });

    if (!application) {
      return {
        success: false,
        error: 'Application not found',
      };
    }

    return {
      success: true,
      data: application as Application,
    };
  } catch (error) {
    console.error('Failed to get application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get application',
    };
  }
}

export async function getAllListings(): Promise<ApiResponse<Listing[]>> {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: listings,
    };
  } catch (error) {
    console.error('Failed to get listings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get listings',
    };
  }
}