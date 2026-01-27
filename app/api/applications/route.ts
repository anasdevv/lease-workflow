import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Create application
  return NextResponse.json({ message: 'Create application' });
}
