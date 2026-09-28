/** Camera body. The lens is painted separately so it stays white. */
export const cameraBodyPath =
  "M8.55 4.7c.3-.75 1.02-1.25 1.82-1.25h3.26c.8 0 1.52.5 1.82 1.25l.48 1.2h1.57A2.5 2.5 0 0 1 20 8.4v8.1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5V8.4A2.5 2.5 0 0 1 6.5 5.9h1.57l.48-1.2Z";

export const cameraLens = { cx: 12, cy: 12.35, r: 3.15 };

/** Tight frame so the camera fills the box instead of floating in padding. */
export const cameraViewBox = "3 2.4 18 17.6";

/** Blue camera with a white lens. The body uses `currentColor`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox={cameraViewBox} className={className}>
      <path d={cameraBodyPath} fill="currentColor" />
      <circle cx={cameraLens.cx} cy={cameraLens.cy} r={cameraLens.r} fill="#fff" />
    </svg>
  );
}
