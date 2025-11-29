import type { Meta, StoryObj } from "@storybook/react";
import { StrictMode, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

/**
 * Creates a Storybook meta configuration with common defaults
 */
export function createStoryMeta<T extends ComponentType<any>>(
  title: string,
  component: T,
  options?: {
    parameters?: Meta<T>["parameters"];
    tags?: Meta<T>["tags"];
  }
) {
  const meta = {
    title,
    component,
    parameters: {
      layout: "fullscreen",
      ...options?.parameters,
    },
    tags: ["autodocs", ...(options?.tags || [])],
  } satisfies Meta<T>;

  return meta;
}

/**
 * Creates the default Story export
 */
export function createDefaultStory<T extends Meta<any>>(): StoryObj<T> {
  return {};
}

/**
 * Renders a story component to the DOM root
 * Used in *-story-main.tsx files
 */
export function renderStory(
  StoryComponent: ComponentType<any>,
  options?: {
    providers?: (children: ReactNode) => ReactNode;
  }
) {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  let content = <StoryComponent />;

  if (options?.providers) {
    content = options.providers(content);
  }

  createRoot(rootElement).render(<StrictMode>{content}</StrictMode>);
}
