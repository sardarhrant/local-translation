"use client";

import { useEffect } from "react";

const AUTO_DISMISS_MS = 6000;

interface ToastProps {
  title: string;
  body: string;
  onDismiss: () => void;
  onClick?: () => void;
}

export default function Toast({ title, body, onDismiss, onClick }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      <div
        role="status"
        className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-zinc-300 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <button
          type="button"
          onClick={onClick}
          className="flex-1 text-left"
        >
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {body}
          </p>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}
