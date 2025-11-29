import { useEffect, useRef, useContext, createContext, ReactNode } from "react";

type PanelId = string;

interface PanelEventHandlers {
  arrowUp?: () => void;
  arrowDown?: () => void;
  enter?: () => void;
}

interface PanelEventBus {
  subscribe: (panelId: PanelId, handlers: PanelEventHandlers) => () => void;
  emit: (panelId: PanelId, event: "arrowUp" | "arrowDown" | "enter") => void;
}

// Create the event bus
class EventBus implements PanelEventBus {
  private listeners: Map<PanelId, PanelEventHandlers> = new Map();

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

