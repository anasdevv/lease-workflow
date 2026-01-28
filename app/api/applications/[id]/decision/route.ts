import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateInternalRequest } from '@/lib/internal-auth';
import { resumeHook } from "workflow/api";

/**
 * POST /api/internal/applications/[id]/submit-review-decision
 * Accepts a human review decision and triggers workflow resumption
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
 

  try {
    const { id } = await params;
    const applicationId = parseInt(id);

    const body = await request.json();
    const { decision, reason } = body;

    // Validate input
    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        workflowRunId: true,
        workflowStatus: true,
        status: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.workflowStatus !== 'paused_for_review') {
      return NextResponse.json(
        {
          error: `Cannot submit decision. Workflow status is "${application.workflowStatus}", expected "paused_for_review"`,
        },
        { status: 400 }
      );
    }

   console.log('Submitting review decision:', { applicationId, decision, reason });

    await resumeHook(`app-${applicationId}`, {
      decision,
      reason: reason || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Application ${decision === 'approved' ? 'approved' : 'rejected'}`,
        applicationId,
        decision,
        reason: reason || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting review decision:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit review decision',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
