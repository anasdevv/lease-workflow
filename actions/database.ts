'use server';

import prisma from '@/lib/db';

// Application Document Actions
export async function getApplicationDocuments(applicationId: number) {
  return prisma.applicationDocument.findMany({
    relationLoadStrategy: 'join',
    where: { applicationId },
    include: { document: true },
  });
}

export async function updateApplicationDocument(
  id: number,
  data: {
    verificationStatus?: string;
    aiExtractedData?: Record<string, unknown> | null;
    confidenceScore?: number;
    extractedAt?: Date;
  }
) {
  return prisma.applicationDocument.update({
    where: { id },
    data: data as Parameters<typeof prisma.applicationDocument.update>[0]['data'],
  });
}

// Application Actions
export async function getApplication(id: number) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      listing: true,
      documents: { include: { document: true } },
      reviewDecisions: true,
    },
  });
}

export async function updateApplication(
  id: number,
  data: Record<string, unknown>
) {
  return prisma.application.update({
    where: { id },
    data: data as Parameters<typeof prisma.application.update>[0]['data'],
  });
}

export async function updateApplicationStatus(
  id: number,
  status: string,
  workflowStatus?: string,
  additionalData?: Record<string, unknown>
) {
  const updateData: Record<string, unknown> = { status };
  if (workflowStatus) updateData.workflowStatus = workflowStatus;
  if (additionalData) Object.assign(updateData, additionalData);

  return prisma.application.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.application.update>[0]['data'],
  });
}

// Human Review Decision Actions
export async function createHumanReviewDecision(
  applicationId: number,
  workflowRunId: string,
  data: {
    decision?: string;
    reason?: string;
    fraudContext?: Record<string, unknown>;
    status?: string;
  }
) {
  const createData: Record<string, unknown> = {
    applicationId,
    workflowRunId,
    ...data,
    reviewedAt: new Date(),
  };

  return prisma.humanReviewDecision.create({
    data: createData as Parameters<typeof prisma.humanReviewDecision.create>[0]['data'],
  });
}

export async function getHumanReviewDecision(applicationId: number) {
  return prisma.humanReviewDecision.findFirst({
    where: { applicationId },
  });
}

// Bulk update Application Documents
export async function updateApplicationDocuments(
  applicationId: number,
  where: Record<string, unknown>,
  data: Record<string, unknown>
) {
  return prisma.applicationDocument.updateMany({
    where: {
      applicationId,
      ...where,
    },
    data: data as Parameters<typeof prisma.applicationDocument.updateMany>[0]['data'],
  });
}
