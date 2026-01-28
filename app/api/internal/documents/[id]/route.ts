import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateInternalRequest } from '@/lib/internal-auth';

// PATCH /api/internal/documents/[id]
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
    const docId = parseInt(id);

    const data = await request.json();

    const updated = await prisma.applicationDocument.update({
      where: { id: docId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
