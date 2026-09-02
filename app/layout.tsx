import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "Parari", template: "%s · Parari" },
  description: "漫画を公開・閲覧できるサービス。閲覧にログインは必要ありません。",
  openGraph: { siteName: "Parari", type: "website", locale: "ja_JP" },
  // Manga arrives from a tweet, so the card is the first thing a reader sees.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
