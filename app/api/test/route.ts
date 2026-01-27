import { NextResponse } from "next/server";
import prisma from '@/lib/db'

export async function GET(request: Request) {
    const listings = await prisma?.listing.findMany();
    return NextResponse.json({ message: 'Create application', data: listings });

}