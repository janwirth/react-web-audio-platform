import { useRef, useMemo } from "react";

interface IframeScalerProps {
  src: string;
  targetWidth: number;
  targetHeight: number;
  zoom?: number;
  className?: string;
}

export function IframeScaler({
  src,
  targetWidth,
  targetHeight,
  zoom = 1,
  className = "",
}: IframeScalerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Calculate iframe dimensions from target dimensions and zoom
  // iframe dimensions = target dimensions / zoom
  // Then scale by zoom to fit back into target (maintaining proportions)
  const { iframeWidth, iframeHeight, scale } = useMemo(() => {
    const iframeW = targetWidth / zoom;
    const iframeH = targetHeight / zoom;
    return {
      iframeWidth: iframeW,
      iframeHeight: iframeH,
      scale: zoom,
    };
  }, [targetWidth, targetHeight, zoom]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: targetWidth > 0 ? `${targetWidth}px` : "100%",
        height: targetHeight > 0 ? `${targetHeight}px` : "100%",
        overflow: "hidden",
        position: "relative",
        border: "1px solid blue",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          width: `${iframeWidth}px`,
          height: `${iframeHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          style={{
            width: `${iframeWidth}px`,
            height: `${iframeHeight}px`,
            border: "none",
            outline: "none",
            background: "white",
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

