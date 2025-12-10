import { NextRequest, NextResponse } from 'next/server';
import { logWebhookRequest } from '@/lib/mongodb';

// Helper to parse body safely
async function parseBody(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';
  
  try {
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      return Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const obj: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        if (value instanceof File) {
          obj[key] = { name: value.name, type: value.type, size: value.size };
        } else {
          obj[key] = value;
        }
      });
      return obj;
    } else {
      // Try to parse as text
      const text = await request.text();
      // Try JSON parsing
      try {
        return JSON.parse(text);
      } catch {
        return text || null;
      }
    }
  } catch (error) {
    console.error('Error parsing body:', error);
    return null;
  }
}

// Extract headers as a plain object
function getHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

// Extract query params as a plain object
function getQueryParams(request: NextRequest): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

// Universal handler for all HTTP methods
async function handleWebhook(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: endpointId } = await params;
  
  const headers = getHeaders(request);
  const query = getQueryParams(request);
  const body = await parseBody(request);
  const contentType = headers['content-type'] || 'unknown';
  
  // Calculate approximate size
  let size = 0;
  if (body) {
    try {
      size = JSON.stringify(body).length;
    } catch {
      size = 0;
    }
  }
  
  // Get client IP (Vercel-specific headers)
  const ip = headers['x-vercel-forwarded-for']?.split(',')[0].trim() ||
             headers['x-forwarded-for']?.split(',')[0].trim() ||
             headers['x-real-ip'] || 
             'unknown';
  
  // Log the request (fail-safe - won't affect response)
  await logWebhookRequest({
    endpointId,
    method: request.method,
    headers,
    body,
    query,
    ip,
    timestamp: new Date(),
    contentType,
    size,
  });
  
  // ALWAYS return 200 OK - this is the core fail-safe feature
  return NextResponse.json({
    success: true,
    message: 'Webhook received',
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}

// Export handlers for all HTTP methods
export const GET = handleWebhook;
export const POST = handleWebhook;
export const PUT = handleWebhook;
export const PATCH = handleWebhook;
export const DELETE = handleWebhook;
export const HEAD = handleWebhook;
export const OPTIONS = handleWebhook;

