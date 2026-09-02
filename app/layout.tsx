import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

// 大きい字は軽く（300）、小さい字は普通（400）。太い字はこの系に無い
const inter = Inter({
  weight: ["300", "400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansJp = Noto_Sans_JP({
  weight: ["300", "400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow-condensed",
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
      className={`h-full antialiased ${inter.variable} ${notoSansJp.variable} ${barlowCondensed.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
