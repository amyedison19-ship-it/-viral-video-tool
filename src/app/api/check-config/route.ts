import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    gemini: !!process.env.GEMINI_API_KEY,
    ark: !!process.env.ARK_API_KEY,
  });
}
