import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./index.css";
import App from "./App.tsx";
import { CommerceProvider } from "./data/CommerceProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <CommerceProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CommerceProvider>
    </TooltipProvider>
  </StrictMode>,
);
