import { describe, expect, it } from "vitest";
import { deliveryKey, originalKey, publicUrl } from "./keys";

const EPISODE = "0fc7d032-9be5-44f6-984a-29f13a611649";

describe("R2 のキー", () => {
  it("0 始まりのページ番号を3桁に詰める", () => {
    expect(deliveryKey(EPISODE, 0)).toBe(`${EPISODE}/000.webp`);
    expect(deliveryKey(EPISODE, 9)).toBe(`${EPISODE}/009.webp`);
    expect(deliveryKey(EPISODE, 123)).toBe(`${EPISODE}/123.webp`);
  });

  it("配信用と原寸は拡張子だけが違う", () => {
    expect(originalKey(EPISODE, 0, "jpg")).toBe(`${EPISODE}/000.jpg`);
  });

  it("公開 URL は配信ドメインの下に置く", () => {
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://img.example.test";
    expect(publicUrl(`${EPISODE}/000.webp`)).toBe(
      `https://img.example.test/${EPISODE}/000.webp`,
    );
  });
});
