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
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set');
      return NextResponse.json(
        { error: 'Blob 存储未配置，请在 Vercel Dashboard 中将 Blob Store 连接到项目' },
        { status: 500 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: we handle the blob URL in the client after upload
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload error:', error);
    const msg = error instanceof Error ? error.message : 'Blob 上传失败';
    return NextResponse.json(
      { error: msg.includes('token') ? '请在 Vercel 中将 Blob Store 连接到此项目（Connect Project）' : msg },
      { status: 400 }
    );
  }
}
