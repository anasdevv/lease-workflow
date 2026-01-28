import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { processApplicationWorkflow } from '@/workflows/application/process-application';
import prisma from '@/lib/db';
import { validateInternalRequest } from '@/lib/internal-auth';

/**
 * POST /api/internal/applications/[id]/retry-workflow
 * Retries a failed workflow for an application
 */
export async function POST(
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

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if workflow status is 'failed'
    if (application.workflowStatus !== 'failed') {
      return NextResponse.json(
        {
          error: `Cannot retry workflow with status: ${application.workflowStatus}. Only 'failed' workflows can be retried.`,
        },
        { status: 400 }
      );
    }

    // Update application status before retrying
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        workflowStatus: 'retrying',
      },
    });

    console.log(
      `[Retry Workflow] Retrying workflow for application ${applicationId}`
    );

    // Start a new workflow run
    const workflowRun = await start(processApplicationWorkflow, [applicationId]);

    return NextResponse.json(
      {
        success: true,
        message: 'Workflow retry started',
        workflowRunId: workflowRun.runId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrying workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to retry workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
