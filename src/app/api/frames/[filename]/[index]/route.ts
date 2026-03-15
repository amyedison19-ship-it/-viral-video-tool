import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const FRAMES_DIR = path.join(os.tmpdir(), 'video-tool-frames');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string; index: string }> }
) {
  const { filename, index } = await params;

  const framePath = path.join(FRAMES_DIR, decodeURIComponent(filename), `${index}.jpg`);

  if (!fs.existsSync(framePath)) {
    // Return a fallback SVG placeholder
    const shotId = parseInt(index) + 1;
    const hue = (shotId * 30) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="288" viewBox="0 0 512 288">
      <rect width="512" height="288" fill="hsl(${hue}, 40%, 25%)" />
      <text x="256" y="134" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">镜头 #${shotId}</text>
      <text x="256" y="160" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="12" font-family="sans-serif">Frame not available</text>
    </svg>`;
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }

  const buffer = fs.readFileSync(framePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
