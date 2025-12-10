import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createWebhookEndpoint, getWebhookEndpoint } from '@/lib/mongodb';

// Create a new webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || undefined;
    
    const id = nanoid(12);
    const result = await createWebhookEndpoint(id, name);
    
    if (!result.success) {
      // Even if DB fails, return the endpoint ID so the webhook can work
      // The logs just won't be persisted
      return NextResponse.json({
        id,
        warning: 'Database unavailable - requests will be accepted but not logged',
        createdAt: new Date().toISOString(),
      });
    }
    
    return NextResponse.json({
      id: result.endpoint?.id,
      createdAt: result.endpoint?.createdAt,
      name: result.endpoint?.name,
    });
  } catch (error) {
    console.error('Error creating endpoint:', error);
    // Fail-safe: still return an ID even on error
    const id = nanoid(12);
    return NextResponse.json({
      id,
      warning: 'Created with limited functionality',
      createdAt: new Date().toISOString(),
    });
  }
}

// Get endpoint info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Endpoint ID required' }, { status: 400 });
  }
  
  const endpoint = await getWebhookEndpoint(id);
  
  if (!endpoint) {
    // Return a virtual endpoint even if not in DB (fail-safe)
    return NextResponse.json({
      id,
      createdAt: null,
      isVirtual: true,
    });
  }
  
  return NextResponse.json(endpoint);
}

