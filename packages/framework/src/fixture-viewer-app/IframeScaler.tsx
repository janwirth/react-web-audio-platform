import { useRef, useEffect, useState } from "react";

interface IframeScalerProps {
  src: string;
  targetWidth: number;
  targetHeight: number;
  iframeWidth: number;
  iframeHeight: number;
  className?: string;
}

export function IframeScaler({
  src,
  targetWidth,
  targetHeight,
  iframeWidth,
  iframeHeight,
  className = "",
}: IframeScalerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate scale to fit iframe dimensions into target rectangle
    const scaleX = targetWidth / iframeWidth;
    const scaleY = targetHeight / iframeHeight;
    const finalScale = Math.min(scaleX, scaleY);

    setScale(finalScale);
  }, [targetWidth, targetHeight, iframeWidth, iframeHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: targetWidth > 0 ? `${targetWidth}px` : "100%",
        height: targetHeight > 0 ? `${targetHeight}px` : "100%",
        overflow: "hidden",
        position: "relative",
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
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

