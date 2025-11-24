import { ReactNode, CSSProperties } from "react";

interface RowProps {
  children: ReactNode;
  maxWidth?: number | string;
  maxHeight?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function Row({ children, maxWidth, maxHeight, className = "", style }: RowProps) {
  const customStyle: CSSProperties = {
    display: "flex",
    flexDirection: "row",
    ...style,
  };

  if (maxWidth !== undefined) {
    customStyle.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  }

  if (maxHeight !== undefined) {
    customStyle.maxHeight = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
  }

  return (
    <div className={`${className}`} style={customStyle}>
      {children}
    </div>
  );
}

