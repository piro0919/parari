import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parari",
  description: "漫画を置いておく場所。読むのにログインは要りません。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
