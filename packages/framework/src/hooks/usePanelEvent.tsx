import { useEffect, useRef, useContext, createContext, ReactNode, useState } from "react";

type PanelId = string;

interface PanelEventHandlers {
  arrowUp?: () => void;
  arrowDown?: () => void;
  enter?: () => void;
}

interface PanelEventBus {
  subscribe: (panelId: PanelId, handlers: PanelEventHandlers) => () => void;
  emit: (panelId: PanelId, event: "arrowUp" | "arrowDown" | "enter") => void;
  setFocusedPanel: (panelId: PanelId | null) => void;
  getFocusedPanel: () => PanelId | null;
  onFocusChange: (callback: (panelId: PanelId | null) => void) => () => void;
}

// Create the event bus
class EventBus implements PanelEventBus {
  private listeners: Map<PanelId, PanelEventHandlers> = new Map();
  private focusedPanel: PanelId | null = null;
  private focusChangeListeners: Set<(panelId: PanelId | null) => void> = new Set();

  subscribe(panelId: PanelId, handlers: PanelEventHandlers): () => void {
    this.listeners.set(panelId, handlers);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(panelId);
    };
  }

  emit(panelId: PanelId, event: "arrowUp" | "arrowDown" | "enter"): void {
    const handlers = this.listeners.get(panelId);
    if (handlers) {
      const handler = handlers[event];
      if (handler) {
        handler();
      }
    }
  }

  setFocusedPanel(panelId: PanelId | null): void {
    this.focusedPanel = panelId;
    this.focusChangeListeners.forEach((callback) => callback(panelId));
  }

  getFocusedPanel(): PanelId | null {
    return this.focusedPanel;
  }

  onFocusChange(callback: (panelId: PanelId | null) => void): () => void {
    this.focusChangeListeners.add(callback);
    return () => {
      this.focusChangeListeners.delete(callback);
    };
  }
}

// Create context
const PanelEventBusContext = createContext<PanelEventBus | null>(null);

// Provider component
export function PanelEventBusProvider({ children }: { children: ReactNode }) {
  const eventBusRef = useRef<PanelEventBus>(new EventBus());

  return (
    <PanelEventBusContext.Provider value={eventBusRef.current}>
      {children}
    </PanelEventBusContext.Provider>
  );
}

// Hook to use panel events
export function usePanelEvent(
  panelId: PanelId,
  handlers: PanelEventHandlers
): void {
  const eventBus = useContext(PanelEventBusContext);
  const handlersRef = useRef<PanelEventHandlers>(handlers);

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!eventBus) {
      console.warn(
        `usePanelEvent: PanelEventBusProvider not found. Panel "${panelId}" events will not work.`
      );
      return;
    }

    // Create wrapper handlers that always use the latest handlers from ref
    const wrappedHandlers: PanelEventHandlers = {
      arrowUp: () => handlersRef.current.arrowUp?.(),
      arrowDown: () => handlersRef.current.arrowDown?.(),
      enter: () => handlersRef.current.enter?.(),
    };

    const unsubscribe = eventBus.subscribe(panelId, wrappedHandlers);
    return unsubscribe;
  }, [eventBus, panelId]);
}

// Hook to get the event bus for emitting events
export function usePanelEventBus(): PanelEventBus | null {
  return useContext(PanelEventBusContext);
}

// Hook to check if a panel is currently focused
export function useIsPanelFocused(panelId: PanelId): boolean {
  const eventBus = useContext(PanelEventBusContext);
  const [isFocused, setIsFocused] = useState<boolean>(() => {
    return eventBus?.getFocusedPanel() === panelId || false;
  });

  useEffect(() => {
    if (!eventBus) return;

    const updateFocus = (focusedPanelId: PanelId | null) => {
      setIsFocused(focusedPanelId === panelId);
    };

    // Set initial state
    updateFocus(eventBus.getFocusedPanel());

    // Subscribe to focus changes
    const unsubscribe = eventBus.onFocusChange(updateFocus);
    return unsubscribe;
  }, [eventBus, panelId]);

  return isFocused;
}

