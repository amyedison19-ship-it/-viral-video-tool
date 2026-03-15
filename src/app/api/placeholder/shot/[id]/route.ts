import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shotId = parseInt(id);
  const hue = (shotId * 30) % 360;

  // Generate a simple SVG placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
    <rect width="200" height="260" fill="hsl(${hue}, 40%, 25%)" />
    <text x="100" y="120" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif">镜头 #${shotId}</text>
    <text x="100" y="150" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="12" font-family="sans-serif">Shot ${shotId}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
