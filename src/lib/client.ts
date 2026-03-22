import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useClientReady() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
