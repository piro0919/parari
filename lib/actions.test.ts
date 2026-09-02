import { beforeEach, describe, expect, it, vi } from "vitest";

// Every call a query builder receives, in order, so a test can say what the
// action asked the database for — the filters are the access control here.
type Call = [string, ...unknown[]];
type Result = { data?: unknown; error?: unknown };

const ops: Record<string, Call[]> = {};
let results: Record<string, Result> = {};
let currentUser: { id: string } | null = null;

function builder(table: string, result: Result) {
  const calls = (ops[table] ??= []);
  const self: unknown = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === "then") {
          return (resolve: (value: Result) => unknown) =>
            Promise.resolve(result).then(resolve);
        }
        return (...args: unknown[]) => {
          calls.push([String(property), ...args]);
          return self;
        };
      },
    },
  );
  return self;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from: (table: string) =>
      builder(table, results[table] ?? { data: null, error: null }),
  }),
}));

const deleteEpisodeObjects = vi.fn();
vi.mock("@/lib/r2", () => ({
  deleteEpisodeObjects: (...args: unknown[]) => deleteEpisodeObjects(...args),
  deliveryKey: () => "key.webp",
  originalKey: () => "key.jpg",
  presignDelivery: async () => "https://delivery.test",
  presignOriginal: async () => "https://original.test",
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

const {
  claimHandle,
  createWork,
  deleteEpisode,
  setEpisodeHidden,
  setXHandle,
} = await import("./actions");

const AUTHOR = { id: "aaaaaaaa-0000-0000-0000-000000000001" };

beforeEach(() => {
  for (const table of Object.keys(ops)) delete ops[table];
  results = { profiles: { data: { handle: "piro" }, error: null } };
  currentUser = AUTHOR;
  deleteEpisodeObjects.mockClear();
});

describe("ログインの確認", () => {
  it("ログインしていなければ何も書かない", async () => {
    currentUser = null;
    await expect(deleteEpisode("e1")).rejects.toThrow("ログインが必要です");
    expect(ops.episodes).toBeUndefined();
    expect(deleteEpisodeObjects).not.toHaveBeenCalled();
  });
});

describe("claimHandle", () => {
  const form = (handle: string) => {
    const data = new FormData();
    data.set("handle", handle);
    return data;
  };

  it("URL にできない文字は登録まで進まない", async () => {
    for (const bad of ["A", "ぴろ", "a", "piro-0919", "x".repeat(21)]) {
      const state = await claimHandle(null, form(bad));
      expect(state.error).not.toBeNull();
    }
    expect(ops.profiles).toBeUndefined();
  });

  it("重なったときは取られている旨を返す", async () => {
    results.profiles = { error: { code: "23505" } };
    const state = await claimHandle(null, form("piro"));
    expect(state.error).toBe("その ID はもう使われています");
  });
});

describe("setXHandle", () => {
  const form = (value: string) => {
    const data = new FormData();
    data.set("x_handle", value);
    return data;
  };

  it("@ を付けて貼られても外して保存する", async () => {
    await setXHandle(null, form("@piro0919"));
    expect(ops.profiles).toContainEqual(["update", { x_handle: "piro0919" }]);
  });

  it("空にすると紐づけを外す", async () => {
    await setXHandle(null, form("  "));
    expect(ops.profiles).toContainEqual(["update", { x_handle: null }]);
  });

  it("X にありえない名前は保存しない", async () => {
    const state = await setXHandle(null, form("x".repeat(16)));
    expect(state.error).not.toBeNull();
    expect(ops.profiles).toBeUndefined();
  });
});

describe("createWork", () => {
  it("空の名前でも61文字でも作らない", async () => {
    await expect(createWork("   ")).rejects.toThrow();
    await expect(createWork("あ".repeat(61))).rejects.toThrow();
    expect(ops.works).toBeUndefined();
  });
});

describe("setEpisodeHidden", () => {
  it("変換の途中の話は公開の対象にしない", async () => {
    results.episodes = { data: { id: "e1" }, error: null };
    await setEpisodeHidden("e1", false);
    expect(ops.episodes).toContainEqual([
      "in",
      "status",
      ["published", "hidden"],
    ]);
  });
});

describe("deleteEpisode", () => {
  it("行が消えてから R2 を消す", async () => {
    results.episodes = { data: { id: "e1" }, error: null };
    await deleteEpisode("e1");
    expect(ops.episodes[0][0]).toBe("delete");
    expect(deleteEpisodeObjects).toHaveBeenCalledWith("e1");
  });

  it("他人の話は行も画像も消さない", async () => {
    results.episodes = { data: null, error: null };
    await expect(deleteEpisode("e1")).rejects.toThrow("消せませんでした");
    expect(deleteEpisodeObjects).not.toHaveBeenCalled();
  });
});
