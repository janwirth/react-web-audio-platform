import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BasicElementsStory from "./basic-elements-story";
import "@/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <BasicElementsStory />
  </StrictMode>
);


