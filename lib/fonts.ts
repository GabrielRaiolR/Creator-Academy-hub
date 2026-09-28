import { Inter } from "next/font/google";
import localFont from "next/font/local";

/** Primary identity typeface (Latin). */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Inter has no Bengali glyphs. This file is the Bengali subset of Noto Sans Bengali
 * (OFL, see fonts/OFL.txt), committed so the Vercel build does not download it.
 */
export const notoSansBengali = localFont({
  src: "../fonts/noto-sans-bengali.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-bengali",
  adjustFontFallback: false,
});
