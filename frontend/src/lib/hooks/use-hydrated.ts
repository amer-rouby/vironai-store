"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false during SSR and the hydration pass, true afterwards — for UI that depends on browser-only state. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
