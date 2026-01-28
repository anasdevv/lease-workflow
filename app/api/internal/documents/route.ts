import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateInternalRequest } from '@/lib/internal-auth';

// GET /api/internal/documents?applicationId=123
export async function GET(request: NextRequest) {
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

    const appDocs = await prisma.applicationDocument.findMany({
      relationLoadStrategy: 'join',
      where: { applicationId },
      include: { document: true },
    });

    return NextResponse.json(appDocs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
