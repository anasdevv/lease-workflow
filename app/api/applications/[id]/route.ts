import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/applications/[id]
 * Returns full application details with documents and review decisions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicantName: true,
        applicantEmail: true,
        status: true,
        workflowStatus: true,
        workflowRunId: true,
        fraudScore: true,
        fraudSignals: true,
        createdAt: true,
        updatedAt: true,
        lastCompletedStep: true,
        documents : {
            include : {
                document : true
            }
        },
        listing: {
          select: {
            id: true,
            address: true,
          },
        },
        reviewDecisions: {
          select: {
            id: true,
            decision: true,
            reason: true,
            fraudContext: true,
            status: true,
            createdAt: true,
          },
          where : {
            status : {
                not : 'completed'
            }
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch application details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
