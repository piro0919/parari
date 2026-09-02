import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

// 重みは 400〜510 の帯に収める。この系は太い字を使わない
const inter = Inter({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansJp = Noto_Sans_JP({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
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
      className={`h-full antialiased ${inter.variable} ${notoSansJp.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
