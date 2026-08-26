"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

export const toast = {
  success: (message: string) => addToast(message, "success"),
  error: (message: string) => addToast(message, "error"),
  info: (message: string) => addToast(message, "info"),
};

let fallbackIdCounter = 0;

function generateToastId(): string {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    try {
      return cryptoApi.randomUUID();
    } catch {
      // Try the next available source when a platform implementation fails.
    }
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    try {
      const values = new Uint32Array(4);
      cryptoApi.getRandomValues(values);
      return Array.from(values, (value) =>
        value.toString(36).padStart(7, "0"),
      ).join("");
    } catch {
      // Fall through to the collision-resistant local identifier below.
    }
  }

  return `fallback-${Date.now().toString(36)}-${(fallbackIdCounter++).toString(36)}`;
}

function addToast(message: string, type: ToastType) {
  const id = generateToastId();

  const newToast = { id, message, type };
  toasts = [...toasts, newToast];
  notify();
  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function notify() {
  toastListeners.forEach((listener) => listener(toasts));
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {currentToasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className={`px-4 py-2 rounded-md shadow-lg text-white text-sm transition-all animate-in fade-in slide-in-from-right-4 pointer-events-auto ${
            t.type === "success"
              ? "bg-green-600"
              : t.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
