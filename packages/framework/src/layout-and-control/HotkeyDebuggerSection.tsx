import { useState, useCallback, ReactNode } from "react";
import { usePanelEvent } from "@/layout-and-control/hooks/usePanelEvent";

interface HotkeyDebuggerSectionProps {
  panelId: string;
  children?: ReactNode;
}

export function HotkeyDebuggerSection({
  panelId,
  children,
}: HotkeyDebuggerSectionProps) {
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  usePanelEvent(panelId, {
    arrowUp: useCallback(() => {
      const event = "Arrow Up";
      console.log(`[${panelId}] ${event}`);
      setLastEvent(event);
    }, [panelId]),
    arrowDown: useCallback(() => {
      const event = "Arrow Down";
      console.log(`[${panelId}] ${event}`);
      setLastEvent(event);
    }, [panelId]),
  });

  return (
    <div className="space-y-2 text-xs opacity-80">
      {children}
      {lastEvent && (
        <div className="mt-4 pt-2 border-t border-gray-300 dark:border-gray-700 text-xs opacity-60">
          Last event: {lastEvent}
        </div>
      )}
    </div>
  );
}


