import { useSyncExternalStore } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEvent: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function setupPwa() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installEvent = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    emit();
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
        // Offline support is a bonus; the app works without it.
      });
    });
  }
}

/** Whether the browser offers to install the app (Chromium-based browsers only). */
export const useCanInstall = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => installEvent !== null,
  );

export async function promptInstall() {
  const event = installEvent;
  if (!event) return;
  await event.prompt();
  await event.userChoice;
  installEvent = null;
  emit();
}
