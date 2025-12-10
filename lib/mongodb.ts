import { MongoClient, Db, Collection, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'webhooky';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db } | null> {
  if (isConnected && client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    isConnected = false;
    return null;
  }
}

export interface WebhookEndpoint {
  _id?: string;
  id: string;
  createdAt: Date;
  name?: string;
}

export interface WebhookLog {
  _id?: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
  ip: string;
  timestamp: Date;
  contentType: string;
  size: number;
}

// Fail-safe wrapper for database operations
async function safeDbOperation<T>(
  operation: (db: Db) => Promise<T>,
  fallback: T
): Promise<{ success: boolean; data: T }> {
  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return { success: false, data: fallback };
    }
    const result = await operation(connection.db);
    return { success: true, data: result };
  } catch (error) {
    console.error('Database operation failed:', error);
    return { success: false, data: fallback };
  }
}

// Create a new webhook endpoint
export async function createWebhookEndpoint(id: string, name?: string): Promise<{ success: boolean; endpoint: WebhookEndpoint | null }> {
  const endpoint: WebhookEndpoint = {
    id,
    createdAt: new Date(),
    name,
  };

  const result = await safeDbOperation(
    async (db) => {
      await db.collection<WebhookEndpoint>('endpoints').insertOne(endpoint);
      return endpoint;
    },
    null
  );

  return { success: result.success, endpoint: result.data };
}

// Get a webhook endpoint by ID
export async function getWebhookEndpoint(id: string): Promise<WebhookEndpoint | null> {
  const result = await safeDbOperation(
    async (db) => {
      return await db.collection<WebhookEndpoint>('endpoints').findOne({ id });
    },
    null
  );

  return result.data;
}

// Log an incoming webhook request - FAIL-SAFE: returns true even if DB fails
export async function logWebhookRequest(log: Omit<WebhookLog, '_id'>): Promise<boolean> {
  const result = await safeDbOperation(
    async (db) => {
      await db.collection<WebhookLog>('logs').insertOne(log as WebhookLog);
      return true;
    },
    false
  );

  // Even if logging fails, we don't fail the webhook
  return true;
}

// Get webhook logs for an endpoint
export async function getWebhookLogs(
  endpointId: string,
  limit: number = 100,
  skip: number = 0
): Promise<{ success: boolean; logs: WebhookLog[]; total: number }> {
  const result = await safeDbOperation(
    async (db) => {
      const collection = db.collection<WebhookLog>('logs');
      const [logs, total] = await Promise.all([
        collection
          .find({ endpointId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments({ endpointId }),
      ]);
      return { logs, total };
    },
    { logs: [], total: 0 }
  );

  return { success: result.success, ...result.data };
}

// Check database connection status
export async function checkDatabaseHealth(): Promise<boolean> {
  const connection = await connectToDatabase();
  return connection !== null;
}

export { connectToDatabase };

