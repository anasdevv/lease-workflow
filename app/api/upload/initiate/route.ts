import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Get presigned URL
  return NextResponse.json({ message: 'Get presigned URL' });
}
