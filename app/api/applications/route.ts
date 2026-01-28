// app/api/applications/search/route.ts
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const riskLevel = searchParams.get('risk') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

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

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        relationLoadStrategy: 'join',
        where,
        select: {
          id: true,
          applicantName: true,
          applicantEmail: true,
          status: true,
          workflowStatus: true,
          fraudScore: true,
          fraudSignals: true,
          createdAt: true,
          updatedAt: true,
          listing: {
            select: {
              id: true,
              address: true,
            }
          },
          _count: {
            select: { documents: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search applications' },
      { status: 500 }
    );
  }
}