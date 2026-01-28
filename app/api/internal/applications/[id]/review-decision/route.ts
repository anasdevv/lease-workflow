import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateInternalRequest } from '@/lib/internal-auth';

// GET /api/internal/applications/[id]/review-decision
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

    const review = await prisma.humanReviewDecision.findFirst({
      where: { applicationId },
    });

    if (!review) {
      return NextResponse.json(null);
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review decision:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review decision' },
      { status: 500 }
    );
  }
}

// POST /api/internal/applications/[id]/review-decision
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

    const data = await request.json();

    const review = await prisma.humanReviewDecision.create({
      data: {
        applicationId,
        ...data,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review decision:', error);
    return NextResponse.json(
      { error: 'Failed to create review decision' },
      { status: 500 }
    );
  }
}

// PATCH /api/internal/applications/[id]/review-decision
export async function PATCH(
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

    const data = await request.json();

    // Find the review decision first
    const existingReview = await prisma.humanReviewDecision.findFirst({
      where: { applicationId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review decision not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.humanReviewDecision.update({
      where: { id: existingReview.id },
      data: {
        ...data,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating review decision:', error);
    return NextResponse.json(
      { error: 'Failed to update review decision' },
      { status: 500 }
    );
  }
}
