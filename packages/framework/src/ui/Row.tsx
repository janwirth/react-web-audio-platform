import { ReactNode, CSSProperties, forwardRef } from "react";

interface RowProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Row = forwardRef<HTMLDivElement, RowProps>((props, ref) => {
  const { children, className, style } = props;

  return (
    <div
      ref={ref}
      {...props}
      className={`${className} grow basis-0 flex flex-row`}
    >
      {children}
    </div>
  );
});
