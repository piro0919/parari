import { describe, expect, it } from "vitest";
import { formatDate } from "./date";

describe("formatDate", () => {
  it("UTC で日付が変わったあとでも日本の日付を出す", () => {
    // 日本時間では 9/2 の朝。サーバーの時計に任せると 9/1 と出る
    expect(formatDate("2026-09-01T23:30:00.000Z")).toBe("2026/9/2");
  });
});
