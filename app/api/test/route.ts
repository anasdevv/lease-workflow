import { NextResponse } from "next/server";
import prisma from '@/lib/db'

export async function GET(request: Request) {
    // const listings = await prisma?.listing.findMany();
      const appDocs = await prisma.applicationDocument.findMany({
      relationLoadStrategy: 'join',
      where: { applicationId: 1 },
      include: { document: true },
    });
    console.log('Listings:', appDocs);
    return NextResponse.json({ message: 'Create application', data: appDocs });

}