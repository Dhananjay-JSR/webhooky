import { NextRequest, NextResponse } from 'next/server';
import { getWebhookLogs } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  const { endpointId } = await params;
  const { searchParams } = new URL(request.url);
  
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  
  const result = await getWebhookLogs(endpointId, limit, skip);
  
  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: 'Database unavailable - logs cannot be retrieved',
      logs: [],
      total: 0,
    }, { status: 503 });
  }
  
  return NextResponse.json({
    success: true,
    logs: result.logs,
    total: result.total,
    limit,
    skip,
  });
}

