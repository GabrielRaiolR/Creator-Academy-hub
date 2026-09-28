import { ImageResponse } from "next/og";
import { cameraBodyPath, cameraLens, cameraViewBox } from "@/components/layout/logo-mark";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Same camera as the header: blue body, white lens, no backdrop. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="64" height="64" viewBox={cameraViewBox}>
          <path d={cameraBodyPath} fill="#0776F3" />
          <circle cx={cameraLens.cx} cy={cameraLens.cy} r={cameraLens.r} fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
