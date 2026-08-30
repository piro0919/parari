"use client";

import { ComicViewer } from "react-comic-viewer";
import "react-comic-viewer/styles.css";

export function Viewer({ pages }: { pages: string[] }) {
  return <ComicViewer pages={pages} direction="rtl" showPageIndicator />;
}
