import { useSyncExternalStore } from 'react';

interface Toast {
  id: number;
  text: string;
}

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Shows a short confirmation message at the bottom of the screen. */
export function toast(text: string) {
  current = { id: Date.now(), text };
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, 5000);
  emit();
}

export const useToast = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
