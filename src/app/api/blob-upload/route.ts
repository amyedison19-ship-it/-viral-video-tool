import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle Vercel Blob client-side upload token generation.
 * This endpoint is called by the @vercel/blob/client `upload()` function
 * to get a secure token for direct browser-to-Blob uploads.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Allow video uploads up to 100MB
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
          maximumSizeInBytes: 100 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // No-op: we handle the blob URL in the client after upload
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Blob 上传失败' },
      { status: 400 }
    );
  }
}
