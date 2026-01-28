import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Add authentication/authorization logic here

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
                    maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
                    //   allowOverwrite : true,
                    addRandomSuffix: true,
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Handle post-upload logic here, e.g., save blob info to database
                }
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 400 }
        );
    }
}