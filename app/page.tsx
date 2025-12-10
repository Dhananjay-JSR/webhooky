'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  const createEndpoint = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (data.id) {
        router.push(`/view/${data.id}`);
      } else {
        setError('Failed to create endpoint');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-[var(--border)] backdrop-blur-sm bg-[var(--background)]/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Webhooky</span>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
            <span className="text-sm text-[var(--foreground-muted)]">Always returns 200 OK</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Test your <span className="gradient-text">webhooks</span>
            <br />with ease
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-[var(--foreground-muted)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Generate unique webhook URLs, capture incoming requests, and inspect payloads in real-time. 
            Built to never fail — even if our database goes down.
          </p>

          {/* CTA Button */}
          <button
            onClick={createEndpoint}
            disabled={isCreating}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl transition-all duration-300 animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Webhook
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-[var(--error)] animate-fade-in">{error}</p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            }
            title="Shareable URLs"
            description="Each webhook gets a unique URL you can share with third-party services"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Always 200 OK"
            description="Never miss a webhook — we always return success, no matter what"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
            title="JSON Viewer"
            description="Beautiful syntax highlighting and one-click copy for all payloads"
          />
        </div>

        {/* Terminal Demo */}
        <div className="mt-24 animate-fade-in">
          <div className="bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--background-tertiary)] border-b border-[var(--border)]">
              <div className="w-3 h-3 rounded-full bg-[var(--error)]"></div>
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]"></div>
              <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
              <span className="ml-3 text-sm text-[var(--foreground-muted)]">Terminal</span>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-[var(--foreground-muted)]">$ curl -X POST {baseUrl}/hook/abc123xyz \</div>
              <div className="text-[var(--foreground-muted)] pl-4">-H &quot;Content-Type: application/json&quot; \</div>
              <div className="text-[var(--foreground-muted)] pl-4">-d &apos;{`{"event": "user.created", "data": {"id": 1}}`}&apos;</div>
              <div className="mt-4 text-[var(--success)]">{`{"success": true, "message": "Webhook received"}`}</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-[var(--foreground-muted)] text-sm">
          Built with Next.js & MongoDB — Fail-safe by design
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center text-[var(--accent)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">{description}</p>
    </div>
  );
}
