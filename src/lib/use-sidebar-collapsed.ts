import { useSyncExternalStore } from "react";

const STORAGE_KEY = "melssa:sidebar-collapsed";
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot(): boolean {
  return false;
}

function setCollapsed(collapsed: boolean): void {
  localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  for (const listener of listeners) listener();
}

export function useSidebarCollapsed(): readonly [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return [collapsed, () => setCollapsed(!getSnapshot())];
}
