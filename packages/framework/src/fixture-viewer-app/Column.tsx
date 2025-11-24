import { ReactNode, CSSProperties, forwardRef } from "react";

interface ColumnProps {
  children: ReactNode;
  maxWidth?: number | string;
  maxHeight?: number | string;
  className?: string;
  style?: CSSProperties;
}

export const Column = forwardRef<HTMLDivElement, ColumnProps>(
  ({ children, maxWidth, maxHeight, className = "", style }, ref) => {
    const customStyle: CSSProperties = {
      display: "flex",
      flexDirection: "column",
      ...style,
    };

    if (maxWidth !== undefined) {
      customStyle.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
    }

    if (maxHeight !== undefined) {
      customStyle.maxHeight = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
    }

    return (
      <div ref={ref} className={`${className}`} style={customStyle}>
        {children}
      </div>
    );
  }
);

