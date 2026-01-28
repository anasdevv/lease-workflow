import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateInternalRequest } from '@/lib/internal-auth';

// PATCH /api/internal/applications/[id]
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

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
