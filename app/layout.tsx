import type { Metadata } from "next";
import { Playfair_Display, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

// 明朝は本文と見出しの両方を持つ。400 と 600 だけで、Miranda の「重い字は
// 抑制を壊す」という線に合わせている
const mincho = Shippori_Mincho({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shippori-mincho",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "Parari", template: "%s · Parari" },
  description: "漫画を置いておく場所。読むのにログインは要りません。",
  openGraph: { siteName: "Parari", type: "website", locale: "ja_JP" },
  // Manga arrives from a tweet, so the card is the first thing a reader sees.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`h-full antialiased ${mincho.variable} ${playfair.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
