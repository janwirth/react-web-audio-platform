import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Story3 from "./story3";
import "../index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <Story3 />
  </StrictMode>
);
