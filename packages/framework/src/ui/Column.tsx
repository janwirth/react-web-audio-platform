import { ReactNode, CSSProperties, forwardRef, HTMLAttributes } from "react";

interface ColumnProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Column = forwardRef<HTMLDivElement, ColumnProps>((props, ref) => {
  const { children, className, style, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={`${className} grow basis-0 flex flex-col`}
      style={style}
    >
      {children}
    </div>
  );
});
