'use client';

import { useState, useEffect, useCallback, use } from 'react';

interface WebhookLog {
  _id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
  ip: string;
  timestamp: string;
  contentType: string;
  size: number;
}

interface LogsResponse {
  success: boolean;
  logs: WebhookLog[];
  total: number;
  error?: string;
}

export default function WebhookView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'body' | 'headers' | 'query'>('body');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const webhookUrl = `${baseUrl}/hook/${id}`;

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/logs/${id}`);
      const data: LogsResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch logs');
        return;
      }

      setLogs(data.logs);
      setError(null);

      // Auto-select first log if none selected
      if (data.logs.length > 0 && !selectedLog) {
        setSelectedLog(data.logs[0]);
      }
    } catch (err) {
      setError('Network error - database may be unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [id, selectedLog]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[method] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] backdrop-blur-sm bg-[var(--background)]/80 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Webhooky</span>
          </a>

          {/* Webhook URL */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
              <span className="text-sm text-[var(--foreground-muted)]">Your URL:</span>
              <code className="text-sm text-[var(--accent)]">{webhookUrl}</code>
              <button
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="ml-2 p-1.5 hover:bg-[var(--background-tertiary)] rounded-md transition-colors"
                title="Copy URL"
              >
                {copied === 'url' ? (
                  <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                autoRefresh 
                  ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]' 
                  : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--foreground-muted)]'}`}></div>
              <span className="text-sm">Auto-refresh</span>
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchLogs}
              className="p-2 hover:bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-[1800px] mx-auto w-full">
        {/* Logs List */}
        <div className="w-[400px] border-r border-[var(--border)] flex flex-col">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Requests</h2>
              <span className="text-sm text-[var(--foreground-muted)]">{logs.length} total</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-[var(--error)] font-medium mb-2">Database Unavailable</p>
              <p className="text-sm text-[var(--foreground-muted)]">{error}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-4">Webhooks are still being accepted!</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="font-medium mb-2">No requests yet</p>
              <p className="text-sm text-[var(--foreground-muted)]">Send a request to your webhook URL</p>
              <div className="mt-6 p-4 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] text-left w-full">
                <p className="text-xs text-[var(--foreground-muted)] mb-2">Try this:</p>
                <code className="text-xs text-[var(--accent)] break-all">
                  curl -X POST {webhookUrl} -H &quot;Content-Type: application/json&quot; -d &apos;{`{"test": true}`}&apos;
                </code>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {logs.map((log) => (
                <button
                  key={log._id}
                  onClick={() => setSelectedLog(log)}
                  className={`w-full p-4 text-left border-b border-[var(--border)] transition-all ${
                    selectedLog?._id === log._id 
                      ? 'bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]' 
                      : 'hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--foreground-muted)] truncate max-w-[200px]">
                      {log.contentType || 'Unknown type'}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {log.size > 1024 ? `${(log.size / 1024).toFixed(1)} KB` : `${log.size} B`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Log Details */}
        <div className="flex-1 flex flex-col">
          {selectedLog ? (
            <>
              {/* Detail Header */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-semibold rounded border ${getMethodColor(selectedLog.method)}`}>
                      {selectedLog.method}
                    </span>
                    <span className="text-[var(--foreground-muted)]">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                    <span>IP: {selectedLog.ip}</span>
                    <span>•</span>
                    <span>{selectedLog.size > 1024 ? `${(selectedLog.size / 1024).toFixed(1)} KB` : `${selectedLog.size} B`}</span>
                  </div>
                </div>

                {/* View Mode Tabs */}
                <div className="flex gap-2">
                  {(['body', 'headers', 'query'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 text-sm rounded-lg transition-all ${
                        viewMode === mode
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      {mode === 'headers' && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">
                          {Object.keys(selectedLog.headers).length}
                        </span>
                      )}
                      {mode === 'query' && Object.keys(selectedLog.query).length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">
                          {Object.keys(selectedLog.query).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* JSON Viewer */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--background-tertiary)] border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {viewMode === 'body' ? selectedLog.contentType : viewMode === 'headers' ? 'Request Headers' : 'Query Parameters'}
                  </span>
                  <button
                    onClick={() => {
                      const data = viewMode === 'body' 
                        ? selectedLog.body 
                        : viewMode === 'headers' 
                          ? selectedLog.headers 
                          : selectedLog.query;
                      copyToClipboard(formatJson(data), viewMode);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--background-secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
                  >
                    {copied === viewMode ? (
                      <>
                        <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <JsonViewer 
                    data={
                      viewMode === 'body' 
                        ? selectedLog.body 
                        : viewMode === 'headers' 
                          ? selectedLog.headers 
                          : selectedLog.query
                    } 
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-[var(--foreground-muted)]">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Select a request to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// JSON Viewer Component with Syntax Highlighting
function JsonViewer({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <span className="json-null">null</span>;
  }

  if (typeof data === 'string' && data.trim() === '') {
    return <span className="text-[var(--foreground-muted)] italic">Empty body</span>;
  }

  const renderValue = (value: unknown, depth: number = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    const nextIndent = '  '.repeat(depth + 1);

    if (value === null) {
      return <span className="json-null">null</span>;
    }

    if (value === undefined) {
      return <span className="json-null">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="json-boolean">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="json-string">&quot;{value}&quot;</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="json-bracket">[]</span>;
      }

      return (
        <>
          <span className="json-bracket">[</span>
          {'\n'}
          {value.map((item, index) => (
            <span key={index}>
              {nextIndent}
              {renderValue(item, depth + 1)}
              {index < value.length - 1 ? ',' : ''}
              {'\n'}
            </span>
          ))}
          {indent}
          <span className="json-bracket">]</span>
        </>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="json-bracket">{'{}'}</span>;
      }

      return (
        <>
          <span className="json-bracket">{'{'}</span>
          {'\n'}
          {entries.map(([key, val], index) => (
            <span key={key}>
              {nextIndent}
              <span className="json-key">&quot;{key}&quot;</span>
              <span className="json-bracket">: </span>
              {renderValue(val, depth + 1)}
              {index < entries.length - 1 ? ',' : ''}
              {'\n'}
            </span>
          ))}
          {indent}
          <span className="json-bracket">{'}'}</span>
        </>
      );
    }

    return String(value);
  };

  return (
    <pre className="font-mono text-sm whitespace-pre leading-relaxed">
      {renderValue(data)}
    </pre>
  );
}

