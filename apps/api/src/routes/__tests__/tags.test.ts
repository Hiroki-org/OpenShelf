import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockDb as createSharedMockDb,
  createTestApp,
  createTestEnv,
  createTestJWT,
  queueSelectResponses as queueSharedSelectResponses,
} from "../../test/helpers";

let mockDb: any;

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => mockDb),
}));

function createMockDb(overrides: Record<string, any> = {}) {
  return createSharedMockDb(overrides);
}

function queueSelectResponses(
  responses: Array<{ getResult?: unknown; allResult?: unknown[] }>,
) {
  queueSharedSelectResponses(mockDb, responses);
}

describe("tags routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    mockDb = createMockDb();
  });

  it("GET /api/tags/suggest returns empty for short queries", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Uploader",
    });
    const app = await createTestApp();
    const env = createTestEnv();

    const res = await app.request(
      "http://localhost/api/tags/suggest?q=a",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tags: [] });
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("GET /api/tags/suggest rejects overly long queries", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Uploader",
    });
    const app = await createTestApp();
    const env = createTestEnv();

    const res = await app.request(
      `http://localhost/api/tags/suggest?q=${"a".repeat(101)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "query too long" });
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("GET /api/tags/suggest returns prefix-matched tags for current user", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Uploader",
    });
    const app = await createTestApp();
    const env = createTestEnv();
    mockDb.all = vi.fn().mockReturnValue([{ tag: "AI" }]);
    const res = await app.request(
      "http://localhost/api/tags/suggest?q=AI",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tags: ["AI"] });
  });

  it("GET /api/tags/suggest returns 403 when org slug is specified by non-member", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Uploader",
    });
    queueSelectResponses([{ getResult: { id: "org-1" } }, { getResult: null }]);

    const app = await createTestApp();
    const env = createTestEnv();
    const res = await app.request(
      "http://localhost/api/tags/suggest?q=AI&orgSlug=my-lab",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("GET /api/tags/suggest excludes private org paper tags for non-authors", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Uploader",
    });
    queueSelectResponses([
      { getResult: { id: "org-1" } },
      { getResult: { userId: "user-1" } },
    ]);

    const app = await createTestApp();
    const env = createTestEnv();
    mockDb.all = vi.fn().mockReturnValue([{ tag: "Search" }, { tag: "Secret Notes" }]);
    const res = await app.request(
      "http://localhost/api/tags/suggest?q=Se&orgSlug=my-lab",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      tags: ["Search", "Secret Notes"],
    });
  });

  it("GET /api/tags/suggest escapes wildcard characters to prevent algorithmic DoS", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Tester",
    });

    const app = await createTestApp();
    const env = createTestEnv();
    mockDb.all = vi.fn().mockReturnValue([]);

    const res = await app.request(
      "http://localhost/api/tags/suggest?q=%25%5C_", // %\_
      { headers: { Authorization: `Bearer ${token}` } },
      env as any,
    );

    expect(res.status).toBe(200);
    const queryChunks = mockDb.all.mock.calls[0][0].queryChunks;
    // queryChunks array usually alternates between static strings and params.
    // The literal should contain the escaped parameter
    const containsEscaped = queryChunks.some((chunk: any) =>
      typeof chunk?.value === 'string'
        ? chunk.value.includes("\\%") || chunk.value.includes("\\_")
        : (chunk as any)?.includes?.("\\%")
    ) || queryChunks.some((chunk: any) => chunk.some?.((v: any) => typeof v === 'string' && (v.includes("\\%") || v.includes("\\_"))));

    // We can also stringify the query output since it's a Drizzle SQL object.
    const queryObj = mockDb.all.mock.calls[0][0];
    const stringified = JSON.stringify(queryObj);
    expect(stringified).toContain("\\%");
    expect(stringified).toContain("\\\\");
    expect(stringified).toContain("\\_");
  });

  it("GET /api/tags/suggest escapes wildcard characters with orgSlug", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Tester",
    });

    const app = await createTestApp();
    const env = createTestEnv();
    mockDb.all = vi.fn().mockReturnValue([]);

    queueSelectResponses([
      { getResult: { id: "org-1" } },
      { getResult: { userId: "user-1" } },
    ]);

    const res = await app.request(
      "http://localhost/api/tags/suggest?q=%25%5C_&orgSlug=test-org", // %\_
      { headers: { Authorization: `Bearer ${token}` } },
      env as any,
    );

    expect(res.status).toBe(200);
    const queryObj = mockDb.all.mock.calls[0][0];
    const stringified = JSON.stringify(queryObj);
    expect(stringified).toContain("\\%");
    expect(stringified).toContain("\\\\");
    expect(stringified).toContain("\\_");
  });

  it("GET /api/tags/suggest returns 404 when orgSlug is not found", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Tester",
    });

    const app = await createTestApp();
    const env = createTestEnv();

    queueSelectResponses([{ getResult: null }]);

    const res = await app.request(
      "http://localhost/api/tags/suggest?q=org&orgSlug=test-org",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Org not found" });
  });

  it("GET /api/tags/suggest returns 403 when user is not a member of the org", async () => {
    const token = await createTestJWT({
      sub: "user-1",
      githubId: "123",
      name: "Tester",
    });

    const app = await createTestApp();
    const env = createTestEnv();

    queueSelectResponses([{ getResult: { id: "org-1" } }, { getResult: null }]);

    const res = await app.request(
      "http://localhost/api/tags/suggest?q=org&orgSlug=test-org",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env as any,
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });
});
