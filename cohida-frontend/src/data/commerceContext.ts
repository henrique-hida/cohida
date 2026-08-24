import { createContext } from "react";

import { demoCommerceRepository } from "./demoCommerceRepository";

export const CommerceContext = createContext<
  typeof demoCommerceRepository | null
>(null);
