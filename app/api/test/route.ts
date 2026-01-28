import { NextResponse } from "next/server";
import prisma from '@/lib/db'

export async function GET(request: Request) {
  try {
    // Test selecting ONLY the columns we can see
    console.log('Test: Select specific fields only');
    const result = await prisma.$queryRaw`SELECT "reviewedAt" FROM "HumanReviewDecision" LIMIT 1`;
console.log('Select specific fields result:', result);
    const test = await prisma.humanReviewDecision.findMany({
        select : {
            id: true,
            applicationId: true,
            decision: true,
            reason: true,
            reviewedAt: true
        }
    });
    console.log('Specific fields result:', test);

   

    return NextResponse.json({ success: true, data: test });
    
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
    //   stack: error.stack
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}