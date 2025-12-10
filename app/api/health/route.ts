import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/mongodb';

export async function GET() {
  const dbHealthy = await checkDatabaseHealth();
  
  return NextResponse.json({
    status: 'ok',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}

