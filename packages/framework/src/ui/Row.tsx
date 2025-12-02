import { ReactNode, CSSProperties, forwardRef, HTMLAttributes } from "react";

interface RowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Row = forwardRef<HTMLDivElement, RowProps>((props, ref) => {
  const { children, className, style, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={`${className} grow basis-0 flex flex-row`}
      style={style}
    >
      {children}
    </div>
  );
});
