import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UserPageClient from "../user-page-client";
import { apiFetch } from "@/lib/api";
import type { useAuth } from "@/components/auth-provider";

type MockAuthState = {
  user: Pick<NonNullable<ReturnType<typeof useAuth>["user"]>, "id"> | null;
};

let authState: MockAuthState;

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => authState,
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("UserPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: { id: "user-1" } };
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("renders the user profile and collections when initialUser is provided", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-1/collections") {
        return new Response(
          JSON.stringify({
            collections: [
              {
                id: "col-1",
                slug: "favorites",
                name: "Favorites",
                description: "Pinned papers",
                visibility: "public",
              },
            ],
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(
      <UserPageClient
        id="user-1"
        initialUser={{
          id: "user-1",
          name: "Alice",
          displayName: "Alice A.",
          avatarUrl: null,
          githubId: "alice",
        }}
      />,
    );

    expect(screen.getByText("Alice A.")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Favorites")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "+ 新規作成" })).toHaveAttribute(
      "href",
      "/collections/new",
    );
  });

  it("fetches user data when initialUser is not provided", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-2") {
        return new Response(
          JSON.stringify({
            user: {
              id: "user-2",
              name: "Bob",
              displayName: "Bob B.",
              avatarUrl: null,
              githubId: "bob",
            },
          }),
          { status: 200 },
        );
      }
      if (url === "/api/users/user-2/collections") {
        return new Response(
          JSON.stringify({
            collections: [
              {
                id: "col-2",
                slug: "reading-list",
                name: "Reading List",
                description: null,
                visibility: "private",
              },
            ],
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(<UserPageClient id="user-2" />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Bob B.")).toBeInTheDocument();
    });
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Reading List")).toBeInTheDocument();
  });

  it("hides the 'new collection' link if the current user is not viewing their own profile", async () => {
    authState = { user: { id: "user-2" } };

    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-1/collections") {
        return new Response(JSON.stringify({ collections: [] }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(
      <UserPageClient
        id="user-1"
        initialUser={{
          id: "user-1",
          name: "Alice",
          displayName: "Alice A.",
          avatarUrl: null,
          githubId: "alice",
        }}
      />,
    );

    expect(screen.getByText("Alice A.")).toBeInTheDocument();
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/api/users/user-1/collections");
    });
    expect(
      screen.queryByRole("link", { name: "+ 新規作成" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error when fetching user data fails with 404", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-not-found") {
        return new Response("{}", { status: 404 });
      }
      if (url === "/api/users/user-not-found/collections") {
        return new Response(JSON.stringify({ collections: [] }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(<UserPageClient id="user-not-found" />);

    expect(
      await screen.findByText("ユーザーが見つかりません"),
    ).toBeInTheDocument();
  });

  it("shows an error when fetching user data fails with 500", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-error") {
        return new Response("{}", { status: 500 });
      }
      if (url === "/api/users/user-error/collections") {
        return new Response(JSON.stringify({ collections: [] }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(<UserPageClient id="user-error" />);

    expect(
      await screen.findByText("ユーザー情報の取得に失敗しました"),
    ).toBeInTheDocument();
  });

  it("shows an error when the API request rejects", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("Network Error"));

    render(<UserPageClient id="user-error" />);

    expect(await screen.findByText("取得に失敗しました")).toBeInTheDocument();
  });

  it("displays 'コレクションがありません' when collections list is empty", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-1/collections") {
        return new Response(
          JSON.stringify({
            collections: [],
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(
      <UserPageClient
        id="user-1"
        initialUser={{
          id: "user-1",
          name: "Alice",
          displayName: "Alice A.",
          avatarUrl: null,
          githubId: "alice",
        }}
      />,
    );

    expect(
      await screen.findByText("コレクションがありません"),
    ).toBeInTheDocument();
  });

  it("uses name when displayName is null", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-1/collections") {
        return new Response(JSON.stringify({ collections: [] }), {
          status: 200,
        });
      }
      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(
      <UserPageClient
        id="user-1"
        initialUser={{
          id: "user-1",
          name: "AliceFallback",
          displayName: null,
          avatarUrl: null,
          githubId: "alice",
        }}
      />,
    );

    expect(screen.getByText("AliceFallback")).toBeInTheDocument();
  });

  it("handles unmount before API calls resolve", async () => {
    let resolveProfile: any;
    let resolveCollections: any;

    const profilePromise = new Promise((resolve) => {
      resolveProfile = resolve;
    });
    const collectionsPromise = new Promise((resolve) => {
      resolveCollections = resolve;
    });

    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-2") {
        return profilePromise as any;
      }
      if (url === "/api/users/user-2/collections") {
        return collectionsPromise as any;
      }
      throw new Error(`Unexpected request: ${String(url)}`);
    });

    const { unmount } = render(<UserPageClient id="user-2" />);

    unmount();

    resolveProfile(
      new Response(
        JSON.stringify({
          user: {
            id: "user-2",
            name: "Bob",
            displayName: null,
            avatarUrl: null,
            githubId: "bob",
          },
        }),
        { status: 200 },
      ),
    );
    resolveCollections(
      new Response(JSON.stringify({ collections: [] }), { status: 200 }),
    );

    await new Promise((r) => setTimeout(r, 0));
  });

  it("handles unmount before API calls reject", async () => {
    let rejectProfile: any;

    const profilePromise = new Promise((_, reject) => {
      rejectProfile = reject;
    });

    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-2") {
        return profilePromise as any;
      }
      if (url === "/api/users/user-2/collections") {
        return new Response(JSON.stringify({ collections: [] }), {
          status: 200,
        });
      }
      throw new Error(`Unexpected request: ${String(url)}`);
    });

    const { unmount } = render(<UserPageClient id="user-2" />);

    unmount();

    rejectProfile(new Error("Network Error"));

    await new Promise((r) => setTimeout(r, 0));
  });

  it("handles unmount before parsing json", async () => {
    let resolveProfileJson: any;
    let resolveCollectionsJson: any;
    const profileJsonPromise = new Promise((resolve) => {
      resolveProfileJson = resolve;
    });
    const collectionsJsonPromise = new Promise((resolve) => {
      resolveCollectionsJson = resolve;
    });

    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-2") {
        return {
          ok: true,
          status: 200,
          json: () => profileJsonPromise,
        } as any;
      }
      if (url === "/api/users/user-2/collections") {
        return {
          ok: true,
          status: 200,
          json: () => collectionsJsonPromise,
        } as any;
      }
      throw new Error(`Unexpected request: ${String(url)}`);
    });

    const { unmount } = render(<UserPageClient id="user-2" />);

    await new Promise((r) => setTimeout(r, 0));

    unmount();

    resolveProfileJson({
      user: {
        id: "user-2",
        name: "Bob",
        displayName: null,
        avatarUrl: null,
        githubId: "bob",
      },
    });
    resolveCollectionsJson({ collections: [] });

    await new Promise((r) => setTimeout(r, 0));
  });

  it("handles collections fetch failure but user fetch success", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-2") {
        return new Response(
          JSON.stringify({
            user: {
              id: "user-2",
              name: "Bob",
              displayName: "Bob B.",
              avatarUrl: null,
              githubId: "bob",
            },
          }),
          { status: 200 },
        );
      }
      if (url === "/api/users/user-2/collections") {
        return new Response("{}", { status: 500 });
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(<UserPageClient id="user-2" />);

    await waitFor(() => {
      expect(screen.getByText("Bob B.")).toBeInTheDocument();
    });
    expect(screen.getByText("コレクションがありません")).toBeInTheDocument();
  });

  it("handles collections json parsing failure", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-2") {
        return new Response(
          JSON.stringify({
            user: {
              id: "user-2",
              name: "Bob",
              displayName: "Bob B.",
              avatarUrl: null,
              githubId: "bob",
            },
          }),
          { status: 200 },
        );
      }
      if (url === "/api/users/user-2/collections") {
        return {
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error("Parsing Error")),
        } as any;
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(<UserPageClient id="user-2" />);

    expect(await screen.findByText("取得に失敗しました")).toBeInTheDocument();
  });

  it("handles collections api error", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-1/collections") {
        return new Response("{}", { status: 500 });
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(
      <UserPageClient
        id="user-1"
        initialUser={{
          id: "user-1",
          name: "Alice",
          displayName: "Alice A.",
          avatarUrl: null,
          githubId: "alice",
        }}
      />,
    );

    expect(screen.getByText("Alice A.")).toBeInTheDocument();
    expect(
      await screen.findByText("コレクションがありません"),
    ).toBeInTheDocument();
  });

  it("handles collections api success with null collections", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url) => {
      if (url === "/api/users/user-1/collections") {
        return new Response(JSON.stringify({ collections: null }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(
      <UserPageClient
        id="user-1"
        initialUser={{
          id: "user-1",
          name: "Alice",
          displayName: "Alice A.",
          avatarUrl: null,
          githubId: "alice",
        }}
      />,
    );

    expect(screen.getByText("Alice A.")).toBeInTheDocument();
    expect(
      await screen.findByText("コレクションがありません"),
    ).toBeInTheDocument();
  });
});
