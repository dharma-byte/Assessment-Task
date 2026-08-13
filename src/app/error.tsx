"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Uncaught exceptions from any Server Component in the
 * tree — including DatabaseUnavailableError/DatabaseConfigError thrown by
 * src/lib/db.ts — land here. Client/server error objects only share
 * `message` across the boundary, so db.ts prefixes its messages
 * (CONFIG_ERROR: / DB_UNAVAILABLE:) rather than relying on `instanceof`.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfigError = error.message.startsWith("CONFIG_ERROR:");
  const isDbUnavailable = error.message.startsWith("DB_UNAVAILABLE:");
  const isDbIssue = isConfigError || isDbUnavailable;

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) px-6 py-16 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-xl text-white"
        style={{ backgroundColor: "var(--status-critical)" }}
        aria-hidden
      >
        {isDbIssue ? "⚠" : "✕"}
      </span>
      <h2 className="text-lg font-semibold text-(--color-text-primary)">
        {isConfigError
          ? "Database isn't configured yet"
          : isDbUnavailable
            ? "Can't reach the database"
            : "Something went wrong"}
      </h2>
      <p className="max-w-md text-sm text-(--color-text-secondary)">
        {isConfigError
          ? "COGNODB_URI and COGNODB_PASSWORD aren't set. Copy .env.example to .env.local, fill in your CognoDB Cloud connection details, and restart the app."
          : isDbUnavailable
            ? "CognoDB didn't respond. It may be paused, waking up, or the connection details may be wrong. This is expected if the instance has been idle — try again in a few seconds."
            : error.message}
      </p>
      <button
        onClick={() => retry()}
        className="rounded-lg px-4 py-2 text-sm font-medium text-(--color-accent-ink)"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Try again
      </button>
    </div>
  );
}
