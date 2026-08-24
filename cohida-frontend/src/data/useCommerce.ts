import { useContext, useSyncExternalStore } from "react";

import { CommerceContext } from "./commerceContext";
import type { DemoCommerceState } from "./demoCommerceRepository";

export function useCommerce() {
  const repository = useContext(CommerceContext);
  if (!repository)
    throw new Error("useCommerce deve ser usado dentro de CommerceProvider.");
  const state = useSyncExternalStore<DemoCommerceState>(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );
  return { ...repository, state };
}
