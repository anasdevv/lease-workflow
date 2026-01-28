import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateInternalRequest } from '@/lib/internal-auth';

// PATCH /api/internal/documents/bulk?applicationId=123
export async function PATCH(request: NextRequest) {
  // Authenticate request
  if (!validateInternalRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const applicationId = parseInt(
      request.nextUrl.searchParams.get('applicationId') || '0'
    );

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    const { where, data } = await request.json();

    const result = await prisma.applicationDocument.updateMany({
      where: {
        applicationId,
        ...where,
      },
      data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating documents:', error);
    return NextResponse.json(
      { error: 'Failed to update documents' },
      { status: 500 }
    );
  }
}
