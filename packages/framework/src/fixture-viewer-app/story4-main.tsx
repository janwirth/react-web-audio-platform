import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Story4 from "./story4";
import "../index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <Story4 />
  </StrictMode>
);

