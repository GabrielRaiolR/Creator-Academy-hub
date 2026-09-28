import { Inter, Noto_Sans_Bengali } from "next/font/google";

/** Primary identity typeface (Latin). */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

/** Inter has no Bengali glyphs; the browser falls back to this face for Bengali characters only. */
export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});
