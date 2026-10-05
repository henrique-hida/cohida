import { CommerceContext } from "./commerceContext";
import { useEffect } from "react";

import { demoCommerceRepository } from "./demoCommerceRepository";
import { customerApi, getSessionRole } from "@/lib/customerApi";

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void demoCommerceRepository.loadCatalog();
    if (getSessionRole() !== "CUSTOMER") {
      demoCommerceRepository.completeSessionHydration();
      return;
    }

    void customerApi
      .me()
      .then((customer) => demoCommerceRepository.startApiSession(customer))
      .catch(() => undefined)
      .finally(() => demoCommerceRepository.completeSessionHydration());
  }, []);

  return (
    <CommerceContext.Provider value={demoCommerceRepository}>
      {children}
    </CommerceContext.Provider>
  );
}
