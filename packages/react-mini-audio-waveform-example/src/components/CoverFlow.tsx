import { useEffect, useRef } from "react";

interface CoverFlowItem {
  id: string;
  title?: string;
  imgSrc?: string;
}

interface CoverFlowProps {
  items?: CoverFlowItem[];
  onItemChange?: (item: CoverFlowItem, index: number) => void;
}

const defaultItems: CoverFlowItem[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i + 1}`,
  title: `Item ${i + 1}`,
  imgSrc: "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f",
}));

export function CoverFlow({
  items = defaultItems,
  onItemChange,
}: CoverFlowProps) {
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const coverRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const clickStartRef = useRef({ x: 0, hasDragged: false, targetIndex: -1 });

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Check if CSS scroll-driven animations are supported
    const supportsScrollTimeline = CSS.supports("animation-timeline", "view()");

    // Function to update spacing based on position (works for both cases)
    const updateSpacing = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      coverRefs.current.forEach((coverEl, index) => {
        if (!coverEl) return;

        const coverRect = coverEl.getBoundingClientRect();
        const coverCenter = coverRect.left + coverRect.width / 2;
        const distanceFromCenter = coverCenter - containerCenter;
        const maxDistance = containerRect.width / 2;
        const progress = Math.max(
          -1,
          Math.min(1, distanceFromCenter / maxDistance)
        );

        // Calculate dynamic margin: more spacing at center (less negative), less spacing at edges (more negative)
        // When progress is 0 (center): margin is -10px (more spacing)
        // When progress is ±1 (edges): margin is -20px (less spacing)
        const marginX = -5 - Math.abs(progress) * 60;

        const itemEl = itemRefs.current[index];
        if (itemEl) {
          itemEl.style.marginLeft = `${marginX}px`;
          itemEl.style.marginRight = `${marginX}px`;
        }
      });
    };

    if (!supportsScrollTimeline) {
      // Use JavaScript fallback with requestAnimationFrame for performance
      let rafId: number | null = null;

      const updateTransforms = () => {
        const containerRect = scrollContainer.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        coverRefs.current.forEach((coverEl, index) => {
          if (!coverEl) return;

          const coverRect = coverEl.getBoundingClientRect();
          const coverCenter = coverRect.left + coverRect.width / 2;
          const distanceFromCenter = coverCenter - containerCenter;
          const maxDistance = containerRect.width / 2;
          const progress = Math.max(
            -1,
            Math.min(1, distanceFromCenter / maxDistance)
          );

          // Calculate rotation: -45deg when left, 0deg when center, 45deg when right
          const rotation = Math.max(-60, Math.min(60, progress * 100));
          // Calculate scale: 0.8 when far, 1 when center
          const scale = 1 - Math.abs(progress) * 0.2;
          // Calculate opacity: 0.6 when far, 1 when center
          const opacity = 0.6 + Math.abs(1 - Math.abs(progress)) * 0.4;
          // Calculate z-index: higher for center elements (closer to 0 progress)
          const zIndex = Math.round(100 - Math.abs(progress) * 100);

          coverEl.style.transform = `perspective(1000px) rotateY(${
            360 - rotation
          }deg) scale(${scale})`;
          coverEl.style.opacity = opacity.toString();

          // Apply z-index to the list item parent for proper stacking
          const itemEl = itemRefs.current[index];
          if (itemEl) {
            itemEl.style.zIndex = zIndex.toString();
          }
        });

        updateSpacing();
        rafId = null;
      };

      const handleScroll = () => {
        if (rafId === null) {
          rafId = requestAnimationFrame(updateTransforms);
        }
      };

      const handleResize = () => {
        if (rafId === null) {
          rafId = requestAnimationFrame(updateTransforms);
        }
      };

      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      window.addEventListener("resize", handleResize, { passive: true });
      updateTransforms(); // Initial update

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    } else {
      // When CSS scroll-driven animations are supported, still update spacing dynamically
      let rafId: number | null = null;

      const handleScroll = () => {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            updateSpacing();
            rafId = null;
          });
        }
      };

      const handleResize = () => {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            updateSpacing();
            rafId = null;
          });
        }
      };

      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      window.addEventListener("resize", handleResize, { passive: true });
      updateSpacing(); // Initial update

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [items]);

  // Drag handlers effect
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const listItem = target.closest("li");
      const targetIndex = listItem
        ? itemRefs.current.indexOf(listItem as HTMLLIElement)
        : -1;

      // Track click start for all interactions
      clickStartRef.current = { x: e.clientX, hasDragged: false, targetIndex };

      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        scrollLeft: scrollContainer.scrollLeft,
      };
      scrollContainer.style.cursor = "grabbing";
      scrollContainer.style.userSelect = "none";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      if (Math.abs(deltaX) > 5) {
        clickStartRef.current.hasDragged = true;
      }
      scrollContainer.scrollLeft = dragStartRef.current.scrollLeft - deltaX;
    };

    const handleMouseUp = () => {
      const { hasDragged, targetIndex } = clickStartRef.current;

      scrollContainer.style.cursor = "grab";
      scrollContainer.style.userSelect = "";
      isDraggingRef.current = false;

      // If we clicked on an item and didn't drag, center it
      if (!hasDragged && targetIndex >= 0) {
        setTimeout(() => {
          centerItem(targetIndex);
        }, 0);
      }

      clickStartRef.current = { x: 0, hasDragged: false, targetIndex: -1 };
    };

    scrollContainer.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      scrollContainer.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Function to center an item by index
  const centerItem = (index: number) => {
    const scrollContainer = scrollContainerRef.current;
    const itemEl = itemRefs.current[index];
    if (!scrollContainer || !itemEl) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    const itemCenter = itemRect.left + itemRect.width / 2;
    const scrollOffset = itemCenter - containerCenter;

    scrollContainer.scrollBy({
      left: scrollOffset,
      behavior: "smooth",
    });

    onItemChange?.(items[index], index);
  };

  return (
    <div className="w-full overflow-y-hidden coverflow-wrapper">
      <ul
        ref={scrollContainerRef}
        className="list-none flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory m-0 scrollbar-none cursor-grab"
        style={{ scrollPadding: "0 50%" }}
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="flex-none w-[200px] snap-center flex flex-col items-center gap-2 relative"
          >
            <div
              ref={(el) => {
                coverRefs.current[index] = el;
              }}
              className="coverflow-cover w-[200px] aspect-square relative"
            >
              <div className="w-full h-full bg-gray-400 dark:bg-gray-600 border border-gray-800 dark:border-gray-400 shadow-lg">
                {item.imgSrc && (
                  <img
                    src={item.imgSrc}
                    alt={item.title}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                )}
              </div>
            </div>
            {item.title && (
              <div className="font-mono text-xs text-gray-600 dark:text-gray-400 text-center">
                {item.title}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
