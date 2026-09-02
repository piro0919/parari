import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it("1 のときだけ s を付けない", () => {
    expect(plural(1, "page")).toBe("1 page");
    expect(plural(0, "page")).toBe("0 pages");
    expect(plural(12, "episode")).toBe("12 episodes");
  });
});
