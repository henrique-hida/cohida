import { CommerceContext } from "./commerceContext";
import { demoCommerceRepository } from "./demoCommerceRepository";

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  return (
    <CommerceContext.Provider value={demoCommerceRepository}>
      {children}
    </CommerceContext.Provider>
  );
}
