'use server';

import prisma from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import type {
  ApplicationFormData,
  UploadedDocumentUI,
  DocumentTypeId,
  ApiResponse,
  Listing,
  Application
} from '@/types';
import { ApplicationQueryTag } from '@/hooks/use-applications';
import { processApplicationWorkflow } from '@/workflows/application/process-application';
import { start } from 'workflow/api';

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
      const app = await tx.application.create({
        data: {
          applicantName: formData.applicantName,
          applicantEmail: formData.applicantEmail,
          listingId: listingId,
          status: 'submitted',
          workflowStatus: 'idle',
        },
      });

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

      const createdDocuments = await tx.document.findMany({
        where: {
          blobUrl: { in: documents.map(d => d.fileUrl) },
        },
        take: documents.length,
      });

      const documentTypeMap: Record<string, DocumentTypeId> = {
        'Pay Stub': 'pay_stub',
        'Tax Return': 'tax_return',
        'ID Verification': 'id_verification',
      };

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
   const result = await start(processApplicationWorkflow,[
      application.id
    ]);
    await prisma.application.update({
      where: { id: application.id },
      data: { workflowStatus: 'running' ,workflowRunId: result.runId},
    })
// await processApplicationWorkflow(application.id);
    revalidatePath(`/`);
      revalidateTag(ApplicationQueryTag.APPLICATIONS,'max'); 
      revalidateTag(ApplicationQueryTag.APPLICATION_STATS,'max'); 


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

interface SearchApplicationsParams {
  searchQuery?: string;
  status?: string;
  riskLevel?: 'all' | 'high' | 'medium' | 'low';
}

export async function searchApplications({
  searchQuery = '',
  status = 'all',
  riskLevel = 'all',
}: SearchApplicationsParams): Promise<ApiResponse<Array<Application & { listing: Listing }>>> {
  try {
    console.log('Searching applications with:', { searchQuery, status, riskLevel });

    // Build risk level filter
    let fraudScoreFilter = {};
    if (riskLevel !== 'all') {
      if (riskLevel === 'high') {
        fraudScoreFilter = { fraudScore: { gte: 70 } };
      } else if (riskLevel === 'medium') {
        fraudScoreFilter = { fraudScore: { gte: 40, lt: 70 } };
      } else if (riskLevel === 'low') {
        fraudScoreFilter = { fraudScore: { lt: 40 } };
      }
    }

    // Only fetch documents if needed for display
    const applications = await prisma.application.findMany({
      relationLoadStrategy : 'join',
      include: {
        listing: true,
        documents: {
          include: {
            document: true,
          },
          // Limit documents per application to avoid massive data fetches
          take: 10,
        },
      },
      where: {
        AND: [
          searchQuery
            ? {
              OR: [
                { applicantName: { contains: searchQuery, mode: 'insensitive' } },
                { applicantEmail: { contains: searchQuery, mode: 'insensitive' } },
                { listing: { address: { contains: searchQuery, mode: 'insensitive' } } },
              ],
            }
            : {},
          status !== 'all' ? { status } : {},
          fraudScoreFilter,
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Add pagination - fetch max 50 at a time
    });

    return {
      success: true,
      data: applications,
    };
  } catch (error) {
    console.log('Error during application search:', error);
    console.error('Failed to search applications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search applications',
    };
  }
}

export async function markWorkflowStarted(applicationId: number) {
  await prisma.application.update({
    where: { id: applicationId },
    data: { workflowStatus: 'running' },
  });
}