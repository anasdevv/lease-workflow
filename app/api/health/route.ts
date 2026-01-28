import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
    try {
        return NextResponse.json(
            {
                status: 'ok',
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Health check failed' },
            { status: 500 }
        );
    }
}
