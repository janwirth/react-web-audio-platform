import { ReactNode } from "react";
import {
  AreaConfig,
  useGridLayoutConfig,
  useGridLayoutFocus,
  useGridLayoutHotkeys,
} from "@/hooks/useGridLayout";

// Re-export for backward compatibility
export type { AreaConfig };

function getFocusablePanelClasses(): string {
  return "pt-3 text-black dark:text-white dark:border-white flex relative";
}

function ActivePanelIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <div className="absolute top-0 left-0 right-0 h-2 z-10 stripe-indicator" />
  );
}

export interface GridLayoutProps {
  header?: ReactNode | AreaConfig;
  footer?: ReactNode | AreaConfig;
  leftSidebar?: ReactNode | AreaConfig;
  rightSidebar?: ReactNode | AreaConfig;
  center?: ReactNode | AreaConfig;
  stage?: ReactNode | AreaConfig;
}

export function GridLayout({
  header,
  footer,
  leftSidebar,
  rightSidebar,
  center,
  stage,
}: GridLayoutProps) {
  const config = useGridLayoutConfig({
    header,
    footer,
    leftSidebar,
    rightSidebar,
    center,
    stage,
  });

  const { focusedArea, navigateLeft, navigateRight } = useGridLayoutFocus({
    leftSidebarConfig: config.leftSidebarConfig,
    centerConfig: config.centerConfig,
    rightSidebarConfig: config.rightSidebarConfig,
  });

  useGridLayoutHotkeys({
    navigateLeft,
    navigateRight,
    focusedArea,
  });

  return (
    <div
      className="w-full h-full font-mono gap-2"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: config.gridTemplateRows,
        gridTemplateAreas: config.gridTemplateAreas.join(" "),
        height: "100vh",
      }}
    >
      {/* Header - full width, auto height */}
      {config.hasHeader && config.headerConfig && (
        <div
          className="border-black dark:border-white flex items-center text-black dark:text-white"
          style={{
            gridArea: "head",
          }}
        >
          {config.headerConfig.render}
        </div>
      )}

      {/* Stage - top half of main content, full width, above center/sidebars */}
      {config.hasStage && config.stageConfig && (
        <div
          className="border-black dark:border-white text-black dark:text-white "
          style={{
            gridArea: "stag",
          }}
        >
          {config.stageConfig.render}
        </div>
      )}

      {/* Left Sidebar - spans bottom half of main content if stage exists, otherwise full height */}
      {config.leftSidebarConfig?.visible && (
        <div
          className={getFocusablePanelClasses()}
          style={{
            gridArea: "left",
          }}
        >
          <ActivePanelIndicator isActive={focusedArea === "leftSidebar"} />
          {config.leftSidebarConfig.render}
        </div>
      )}

      {/* Center - bottom half of main content if stage exists, otherwise full height */}
      {config.centerConfig?.visible && (
        <main
          className={getFocusablePanelClasses()}
          style={{
            gridArea: "cent",
          }}
        >
          <ActivePanelIndicator isActive={focusedArea === "center"} />
          {config.centerConfig.render}
        </main>
      )}

      {/* Right Sidebar - spans bottom half of main content if stage exists, otherwise full height */}
      {config.rightSidebarConfig?.visible && (
        <div
          className={getFocusablePanelClasses()}
          style={{
            gridArea: "rght",
          }}
        >
          <ActivePanelIndicator isActive={focusedArea === "rightSidebar"} />
          {config.rightSidebarConfig.render}
        </div>
      )}

      {/* Footer - full width, auto height */}
      {config.hasFooter && config.footerConfig && (
        <div
          className="border-black dark:border-white flex items-center text-black dark:text-white"
          style={{
            gridArea: "foot",
          }}
        >
          {config.footerConfig.render}
        </div>
      )}
    </div>
  );
}
