import { describe, expect, it } from "vitest";
import { orderPages } from "./page-order";

const image = (name: string) => ({ name, type: "image/png" });

describe("orderPages", () => {
  it("2 を 10 より前に置く", () => {
    const ordered = orderPages([image("10.png"), image("2.png"), image("1.png")]);
    expect(ordered.map((file) => file.name)).toEqual([
      "1.png",
      "2.png",
      "10.png",
    ]);
  });

  it("ゼロ詰めされていない書き出しでも並ぶ", () => {
    const ordered = orderPages([
      image("page-12.jpg"),
      image("page-3.jpg"),
      image("page-1.jpg"),
    ]);
    expect(ordered.map((file) => file.name)).toEqual([
      "page-1.jpg",
      "page-3.jpg",
      "page-12.jpg",
    ]);
  });

  it("画像でないものは落とす", () => {
    const ordered = orderPages([
      image("1.png"),
      { name: "memo.txt", type: "text/plain" },
      { name: "clip.mp4", type: "video/mp4" },
    ]);
    expect(ordered.map((file) => file.name)).toEqual(["1.png"]);
  });

  it("渡された配列は並べ替えない", () => {
    const files = [image("2.png"), image("1.png")];
    orderPages(files);
    expect(files.map((file) => file.name)).toEqual(["2.png", "1.png"]);
  });
});
