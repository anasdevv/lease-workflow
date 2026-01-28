import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const riskLevel = searchParams.get('risk') || 'all';

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (riskLevel && riskLevel !== 'all') {
      const scoreRanges = {
        high: { gte: 70 },
        medium: { gte: 40, lt: 70 },
        low: { lt: 40 }
      };
      where.fraudScore = scoreRanges[riskLevel as keyof typeof scoreRanges];
    }

    if (searchQuery) {
      where.OR = [
        { applicantName: { contains: searchQuery, mode: 'insensitive' } },
        { applicantEmail: { contains: searchQuery, mode: 'insensitive' } },
        { listing: { address: { contains: searchQuery, mode: 'insensitive' } } }
      ];
    }

    const [
      total,
      pendingReview,
      highRisk,
      approved,
    ] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.count({
        where: { ...where, workflowStatus: 'paused_for_review' }
      }),
      prisma.application.count({
        where: { ...where, fraudScore: { gte: 70 } }
      }),
      prisma.application.count({
        where: { ...where, status: 'approved' }
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        pendingReview,
        highRisk,
        approved,
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}