import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Confirm upload
  return NextResponse.json({ message: 'Confirm upload' });
}
