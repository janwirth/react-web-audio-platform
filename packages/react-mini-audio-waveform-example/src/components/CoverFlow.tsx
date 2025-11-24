import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";

interface CoverFlowItem {
  id: string;
  title?: string;
  imgSrc?: string | null;
}

interface CoverFlowProps {
  items?: CoverFlowItem[];
  onItemChange?: (item: CoverFlowItem, index: number) => void;
  onFocussedItem?: (item: CoverFlowItem, index: number) => void;
}

export interface CoverFlowRef {
  scrollToFirst: () => void;
  scrollToLast: () => void;
  scrollToIndex: (index: number) => void;
}

const defaultItems: CoverFlowItem[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i + 1}`,
  title: `Item ${i + 1}`,
  imgSrc:
    i % 2 === 0
      ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
      : null,
}));

export const CoverFlow = forwardRef<CoverFlowRef, CoverFlowProps>(
  ({ items = defaultItems, onItemChange, onFocussedItem }, ref) => {
    const scrollContainerRef = useRef<HTMLUListElement>(null);
    const coverRefs = useRef<(HTMLDivElement | null)[]>([]);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
    const clickStartRef = useRef({ x: 0, hasDragged: false, targetIndex: -1 });
    const velocityRef = useRef({ x: 0, lastX: 0, lastTime: 0 });
    const momentumAnimationRef = useRef<number | null>(null);
    const hasInitializedRef = useRef(false);
    const centeredIndexRef = useRef<number>(-1);

    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      // Check if CSS scroll-driven animations are supported
      const supportsScrollTimeline = CSS.supports(
        "animation-timeline",
        "view()"
      );

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

          let closestIndex = -1;
          let minDistance = Infinity;

          coverRefs.current.forEach((coverEl, index) => {
            if (!coverEl) return;

            const coverRect = coverEl.getBoundingClientRect();
            const coverCenter = coverRect.left + coverRect.width / 2;
            const distanceFromCenter = Math.abs(coverCenter - containerCenter);
            const maxDistance = containerRect.width / 2;
            const progress = Math.max(
              -1,
              Math.min(1, (coverCenter - containerCenter) / maxDistance)
            );

            // Track the closest item to center
            if (distanceFromCenter < minDistance) {
              minDistance = distanceFromCenter;
              closestIndex = index;
            }

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

          // Emit event if centered item changed
          if (closestIndex >= 0 && closestIndex !== centeredIndexRef.current) {
            centeredIndexRef.current = closestIndex;
            onFocussedItem?.(items[closestIndex], closestIndex);
          }

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

        const detectCenteredItem = () => {
          const containerRect = scrollContainer.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;

          let closestIndex = -1;
          let minDistance = Infinity;

          coverRefs.current.forEach((coverEl, index) => {
            if (!coverEl) return;

            const coverRect = coverEl.getBoundingClientRect();
            const coverCenter = coverRect.left + coverRect.width / 2;
            const distanceFromCenter = Math.abs(coverCenter - containerCenter);

            if (distanceFromCenter < minDistance) {
              minDistance = distanceFromCenter;
              closestIndex = index;
            }
          });

          // Emit event if centered item changed
          if (closestIndex >= 0 && closestIndex !== centeredIndexRef.current) {
            centeredIndexRef.current = closestIndex;
            onFocussedItem?.(items[closestIndex], closestIndex);
          }
        };

        const handleScroll = () => {
          if (rafId === null) {
            rafId = requestAnimationFrame(() => {
              updateSpacing();
              detectCenteredItem();
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
        detectCenteredItem(); // Initial centered item detection

        return () => {
          scrollContainer.removeEventListener("scroll", handleScroll);
          window.removeEventListener("resize", handleResize);
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
        };
      }
    }, [items, onFocussedItem]);

    // Drag handlers effect
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const cancelMomentum = () => {
        if (momentumAnimationRef.current !== null) {
          cancelAnimationFrame(momentumAnimationRef.current);
          momentumAnimationRef.current = null;
        }
      };

      const applyMomentum = (velocity: number) => {
        cancelMomentum();

        if (Math.abs(velocity) < 0.1) return;

        const friction = 0.95; // Deceleration factor
        let currentVelocity = velocity;

        const animate = () => {
          if (Math.abs(currentVelocity) < 0.1) {
            momentumAnimationRef.current = null;
            return;
          }

          scrollContainer.scrollLeft -= currentVelocity;
          currentVelocity *= friction;
          momentumAnimationRef.current = requestAnimationFrame(animate);
        };

        momentumAnimationRef.current = requestAnimationFrame(animate);
      };

      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const listItem = target.closest("li");
        const targetIndex = listItem
          ? itemRefs.current.indexOf(listItem as HTMLLIElement)
          : -1;

        // Cancel any existing momentum
        cancelMomentum();

        // Track click start for all interactions
        clickStartRef.current = {
          x: e.clientX,
          hasDragged: false,
          targetIndex,
        };

        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.clientX,
          scrollLeft: scrollContainer.scrollLeft,
        };

        // Reset velocity tracking
        const now = performance.now();
        velocityRef.current = {
          x: 0,
          lastX: e.clientX,
          lastTime: now,
        };

        scrollContainer.style.cursor = "grabbing";
        scrollContainer.style.userSelect = "none";
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;

        // Cancel momentum during drag
        cancelMomentum();

        const deltaX = e.clientX - dragStartRef.current.x;
        if (Math.abs(deltaX) > 5) {
          clickStartRef.current.hasDragged = true;
        }
        scrollContainer.scrollLeft = dragStartRef.current.scrollLeft - deltaX;

        // Track velocity for momentum
        const now = performance.now();
        const timeDelta = now - velocityRef.current.lastTime;
        if (timeDelta > 0) {
          const distanceDelta = e.clientX - velocityRef.current.lastX;
          velocityRef.current.x = distanceDelta / timeDelta;
          velocityRef.current.lastX = e.clientX;
          velocityRef.current.lastTime = now;
        }
      };

      const handleScroll = () => {
        // Cancel momentum on any scroll event
        cancelMomentum();
      };

      const handleMouseUp = () => {
        const { hasDragged, targetIndex } = clickStartRef.current;

        scrollContainer.style.cursor = "grab";
        scrollContainer.style.userSelect = "";
        isDraggingRef.current = false;

        // If we clicked on an item and didn't drag, center it
        if (!hasDragged && targetIndex >= 0) {
          cancelMomentum();
          setTimeout(() => {
            centerItem(targetIndex);
          }, 0);
        } else if (hasDragged) {
          // Apply momentum based on velocity
          // Convert velocity from px/ms to px/frame (assuming ~60fps = ~16.67ms per frame)
          const velocityPerFrame = velocityRef.current.x * 16.67;
          applyMomentum(velocityPerFrame);
        }

        clickStartRef.current = { x: 0, hasDragged: false, targetIndex: -1 };
      };

      scrollContainer.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        scrollContainer.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        scrollContainer.removeEventListener("scroll", handleScroll);
        cancelMomentum();
      };
    }, []);

    // Function to center an item by index
    const centerItem = useCallback(
      (index: number) => {
        const scrollContainer = scrollContainerRef.current;
        const itemEl = itemRefs.current[index];
        if (!scrollContainer || !itemEl) return;

        // Get item position relative to scroll container content (includes padding)
        const itemLeft = itemEl.offsetLeft;
        const itemWidth = itemEl.offsetWidth;
        const itemCenterInContent = itemLeft + itemWidth / 2;

        // Calculate target scroll position: item center should align with viewport center
        // Viewport center in content coordinates = scrollLeft + clientWidth/2
        // So: itemCenterInContent = targetScrollLeft + clientWidth/2
        // Therefore: targetScrollLeft = itemCenterInContent - clientWidth/2
        const containerWidth = scrollContainer.clientWidth;
        const targetScrollLeft = itemCenterInContent - containerWidth / 2;

        scrollContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: "smooth",
        });

        onItemChange?.(items[index], index);
        onFocussedItem?.(items[index], index);
      },
      [items, onItemChange, onFocussedItem]
    );

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollToFirst: () => {
          if (items.length > 0) {
            centerItem(0);
          }
        },
        scrollToLast: () => {
          if (items.length > 0) {
            centerItem(items.length - 1);
          }
        },
        scrollToIndex: (index: number) => {
          if (index >= 0 && index < items.length) {
            centerItem(index);
          }
        },
      }),
      [items, centerItem]
    );

    // Initial scroll to first item on mount
    useEffect(() => {
      if (hasInitializedRef.current || items.length === 0) return;

      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      // Wait for DOM to be ready, then scroll to first item instantly
      const scrollToFirst = () => {
        const firstItem = itemRefs.current[0];
        if (firstItem && scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const itemRect = firstItem.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;
          const itemCenter = itemRect.left + itemRect.width / 2;
          const scrollOffset = itemCenter - containerCenter;

          // Use instant scroll for initial positioning
          scrollContainer.scrollLeft += scrollOffset;
          onItemChange?.(items[0], 0);
          onFocussedItem?.(items[0], 0);
          hasInitializedRef.current = true;
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToFirst);
      });
    }, [items, onItemChange]);

    // Keyboard handlers for Home/End keys
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle if the coverflow container or its children have focus
        if (!scrollContainer.contains(document.activeElement)) return;

        if (e.key === "Home") {
          e.preventDefault();
          if (items.length > 0) {
            centerItem(0);
          }
        } else if (e.key === "End") {
          e.preventDefault();
          if (items.length > 0) {
            centerItem(items.length - 1);
          }
        }
      };

      // Make the container focusable
      scrollContainer.setAttribute("tabindex", "0");
      scrollContainer.addEventListener("keydown", handleKeyDown);

      return () => {
        scrollContainer.removeEventListener("keydown", handleKeyDown);
      };
    }, [items, centerItem]);

    return (
      <>
        <style>{`
        .scrollbar-none {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .coverflow-wrapper {
          perspective: 1000px;
          perspective-origin: center center;
        }

        .coverflow-cover {
          transform-style: preserve-3d;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-box-reflect: below 8px linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 60%);
        }

        .coverflow-cover img {
          -webkit-user-drag: none;
          user-drag: none;
        }

        /* Fallback reflection for non-WebKit browsers using pseudo-element */
        @supports not (-webkit-box-reflect: below) {
          .coverflow-cover::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            height: 100%;
            transform: scaleY(-1);
            opacity: 0.3;
            background: inherit;
            pointer-events: none;
            mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent 60%);
            -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent 60%);
          }
        }

        /* Use CSS scroll-driven animations when supported */
        @supports (animation-timeline: view()) {
          .coverflow-cover {
            animation: coverflow-rotate linear;
            animation-timeline: view();
            animation-range: entry 0% exit 100%;
          }
        }

        @keyframes coverflow-rotate {
          0% {
            transform: perspective(1000px) rotateY(45deg) scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: perspective(1000px) rotateY(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: perspective(1000px) rotateY(-45deg) scale(0.8);
            opacity: 0.6;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .coverflow-cover {
            animation: none;
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
        }
      `}</style>
        <div className="w-full overflow-y-hidden coverflow-wrapper">
          <ul
            ref={scrollContainerRef}
            className="list-none flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory m-0 scrollbar-none cursor-grab"
            style={{
              scrollPadding: "0 50%",
              paddingLeft: "calc(50vw - 100px)",
              paddingRight: "calc(50vw - 100px)",
            }}
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
      </>
    );
  }
);
