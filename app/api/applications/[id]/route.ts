import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Get application status
  return NextResponse.json({ message: `Get application status for ${params.id}` });
}
