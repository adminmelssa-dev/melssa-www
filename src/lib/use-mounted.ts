import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client-side mount — SSR-safe, without setState-in-effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
