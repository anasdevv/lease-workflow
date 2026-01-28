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
                // For example, verify the user is logged in

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
                    maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
                    //   allowOverwrite : true,
                    addRandomSuffix: true,
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Optional: Run any server-side logic after upload completes
                // For example, save blob URL to database
                console.log('Upload completed:', blob.url);
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