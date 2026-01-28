import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateInternalRequest } from '@/lib/internal-auth';
import { getStepNumber, WORKFLOW_STEPS, calculateProgressPercentage } from '@/lib/utils';

/**
 * GET /api/internal/applications/[id]/workflow-status
 * Returns detailed workflow status and step progress information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate request
  if (!validateInternalRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const applicationId = parseInt(id);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        workflowRunId: true,
        workflowStatus: true,
        lastCompletedStep: true,
        workflowErrorDetails: true,
        status: true,
        fraudScore: true,
        fraudSignals: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Build step progress data based on lastCompletedStep
    const stepsProgress = WORKFLOW_STEPS.map((step) => {
      const lastCompletedStepNumber = getStepNumber(application.lastCompletedStep || '');
      const isFailed = application.workflowStatus === 'failed' && lastCompletedStepNumber < step.number;
      
      return {
        ...step,
        status:
          lastCompletedStepNumber >= step.number ? 'completed' :
          isFailed ? 'failed' :
          'pending',
      };
    });

    return NextResponse.json(
      {
        id: application.id,
        workflowRunId: application.workflowRunId,
        workflowStatus: application.workflowStatus,
        lastCompletedStep: application.lastCompletedStep,
        applicationStatus: application.status,
        steps: stepsProgress,
        progressPercentage: calculateProgressPercentage(application.lastCompletedStep),
        error:
          application.workflowStatus === 'failed'
            ? application.workflowErrorDetails
            : null,
        fraudScore: application.fraudScore,
        fraudSignals: application.fraudSignals,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch workflow status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

