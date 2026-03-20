"use client";

import Link from "next/link";

export default function PlayoffsLandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--fpl-bg-deep)" }}>
      <div className="max-w-md mx-auto px-5 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--fpl-text-primary)" }}>
            Playoffs
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--fpl-text-muted)" }}>
            Select a competition to continue.
          </p>
        </header>

        <div className="space-y-4">
          <Link
            href="/playoffs/tvt"
            className="block p-5 rounded-xl transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--fpl-bg-card)",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)"
            }}
          >
            <div className="text-xs uppercase" style={{ color: "var(--fpl-text-muted)" }}>
              TVT Playoffs
            </div>
            <div className="text-lg font-semibold mt-2" style={{ color: "var(--fpl-text-primary)" }}>
              Round of 16
            </div>
          </Link>

          <div
            className="p-5 rounded-xl opacity-60"
            style={{
              backgroundColor: "var(--fpl-bg-card)",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)"
            }}
          >
            <div className="text-xs uppercase" style={{ color: "var(--fpl-text-muted)" }}>
              Challenger Playoffs
            </div>
            <div className="text-lg font-semibold mt-2" style={{ color: "var(--fpl-text-primary)" }}>
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
