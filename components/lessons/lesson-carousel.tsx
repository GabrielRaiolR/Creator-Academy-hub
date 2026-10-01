"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { IconButton } from "@/components/ui/button";
import { format } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const SWIPE_MS = 620;
const SWIPE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type PointerDrag = {
  id: number;
  x: number;
  y: number;
  lastX: number;
  lastT: number;
  velocity: number;
  active: boolean;
  locked: boolean;
};

type LessonCarouselProps = {
  children: ReactNode;
  pageSize?: number;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
};

/** Pages of cards that slide sideways. Arrows sit below; a drag follows the finger and snaps. */
export function LessonCarousel({
  children,
  pageSize = 3,
  previousLabel,
  nextLabel,
  pageLabel,
}: LessonCarouselProps) {
  const items = Children.toArray(children);
  const pages: ReactNode[][] = [];
  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }
  const pageCount = Math.max(pages.length, 1);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<PointerDrag | null>(null);
  const pageRef = useRef(0);
  const pageCountRef = useRef(pageCount);
  const suppressClick = useRef(false);
  const [page, setPageState] = useState(0);
  const [offset, setOffset] = useState(0);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useLayoutEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount]);

  function setPage(next: number) {
    const clamped = Math.max(0, Math.min(pageCountRef.current - 1, next));
    pageRef.current = clamped;
    setPageState(clamped);
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pageRef.current <= pageCount - 1) return;
    pageRef.current = Math.max(0, pageCount - 1);
    setPageState(pageRef.current);
  }, [pageCount]);

  function rubber(dx: number) {
    const atStart = pageRef.current <= 0 && dx > 0;
    const atEnd = pageRef.current >= pageCountRef.current - 1 && dx < 0;
    return atStart || atEnd ? dx * 0.32 : dx;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      active: true,
      locked: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag?.active || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.active = false;
        return;
      }
      drag.locked = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    const dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.velocity = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    setOffset(rubber(dx));
  }

  function finishDrag(dx: number, velocity: number) {
    const view = viewportRef.current?.clientWidth ?? 1;
    const threshold = Math.min(96, view * 0.16);
    let next = pageRef.current;
    if (dx <= -threshold || velocity < -0.45) next += 1;
    else if (dx >= threshold || velocity > 0.45) next -= 1;
    // Turn the transition back on while the strip is still under the finger,
    // then animate to the snapped page on the next frame.
    setDragging(false);
    requestAnimationFrame(() => {
      setOffset(0);
      setPage(next);
    });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag?.active || drag.id !== event.pointerId) {
      dragRef.current = null;
      return;
    }
    const dx = event.clientX - drag.x;
    const locked = drag.locked;
    const velocity = drag.velocity;
    dragRef.current = null;
    if (!locked) return;
    suppressClick.current = Math.abs(dx) > 6;
    finishDrag(dx, velocity);
  }

  function onPointerCancel() {
    dragRef.current = null;
    setDragging(false);
    requestAnimationFrame(() => setOffset(0));
  }

  const current = Math.min(page, pageCount - 1);

  return (
    <div>
      <div
        ref={viewportRef}
        className={cn(
          "cursor-grab overflow-hidden rounded-[2rem] shadow-ring touch-pan-y",
          dragging && "cursor-grabbing select-none",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
        <div
          className="flex"
          style={{
            transform: `translate3d(${-current * width + offset}px, 0, 0)`,
            transition: dragging || reduceMotion ? "none" : `transform ${SWIPE_MS}ms ${SWIPE_EASE}`,
          }}
        >
          {pages.map((pageItems, index) => (
            <ul
              key={index}
              className="grid shrink-0 grid-cols-1 gap-px bg-zinc-200 md:grid-cols-3"
              style={{ width: width > 0 ? width : "100%" }}
              inert={index === current ? undefined : true}
              aria-hidden={index === current ? undefined : true}
            >
              {pageItems}
            </ul>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <IconButton label={previousLabel} disabled={current === 0} onClick={() => setPage(current - 1)} className="bg-white shadow-ring">
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} />
        </IconButton>
        <p className="min-w-28 text-center text-xs tabular-nums text-zinc-400" aria-live="polite">
          {format(pageLabel, { page: current + 1, total: pageCount })}
        </p>
        <IconButton
          label={nextLabel}
          disabled={current >= pageCount - 1}
          onClick={() => setPage(current + 1)}
          className="bg-white shadow-ring"
        >
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </IconButton>
      </div>
    </div>
  );
}
