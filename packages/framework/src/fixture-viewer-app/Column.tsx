import { ReactNode, CSSProperties, forwardRef } from "react";

interface ColumnProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Column = forwardRef<HTMLDivElement, ColumnProps>((props, ref) => {
  const { children, className, style } = props;

  return (
    <div
      ref={ref}
      {...props}
      className={`${className} grow basis-0 flex flex-col`}
    >
      {children}
    </div>
  );
});
