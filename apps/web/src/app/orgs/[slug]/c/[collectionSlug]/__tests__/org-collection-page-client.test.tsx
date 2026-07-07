import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrgCollectionPageClient from "../org-collection-page-client";
import { apiFetch } from "@/lib/api";

let authState: any;

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

describe("OrgCollectionPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: { id: "user-1" } };
  });

  it("reorders papers for admins, renders abstract, and handles errors", async () => {
    const state = {
      collections: [
        {
          id: "col-1",
          slug: "featured",
          name: "Featured",
          description: "Featured papers",
          visibility: "public",
        },
      ],
      papers: [
        {
          id: "paper-1",
          title: "First paper",
          abstract: "First abstract content",
          visibility: "public",
          sortOrder: 0,
        },
        {
          id: "paper-2",
          title: "Second paper",
          abstract: null,
          visibility: "public",
          sortOrder: 1,
        },
      ],
      members: [{ userId: "user-1", role: "admin" }],
    };

    let fetchCount = 0;
    vi.mocked(apiFetch).mockImplementation(async (url, init) => {
      const method = (init?.method ?? "GET").toUpperCase();

      if (url === "/api/orgs/lab/collections") {
        return new Response(
          JSON.stringify({ collections: state.collections }),
          { status: 200 },
        );
      }
      if (url === "/api/collections/col-1/papers" && method === "GET") {
        return new Response(JSON.stringify({ papers: state.papers }), {
          status: 200,
        });
      }
      if (url === "/api/orgs/lab/members") {
        return new Response(JSON.stringify({ members: state.members }), {
          status: 200,
        });
      }
      if (url === "/api/collections/col-1/papers" && method === "PATCH") {
        fetchCount++;
        // First click (下に移動 on paper-1) succeeds
        if (fetchCount === 1) {
          const body = JSON.parse(String(init?.body ?? "{}"));
          expect(body.paper_ids).toEqual(["paper-2", "paper-1"]);
          return new Response("{}", { status: 200 });
        }
        // Second click (上に移動 on paper-1 which is now at index 1) fails
        throw new Error("Simulated API failure");
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    render(<OrgCollectionPageClient slug="lab" collectionSlug="featured" />);

    await waitFor(() => {
      expect(screen.getByText("Featured")).toBeInTheDocument();
      // Verify abstract renders correctly
      expect(screen.getByText("First abstract content")).toBeInTheDocument();
    });

    // 1. Move paper-1 DOWN (index 0 -> 1)
    fireEvent.click(screen.getAllByRole("button", { name: "下に移動" })[0]);

    await waitFor(() => {
      const links = screen.getAllByRole("link").filter((link) => {
        const href = link.getAttribute("href") ?? "";
        return href.startsWith("/papers/");
      });
      // Verify DOM updated optimistically
      expect(links[0]).toHaveTextContent("Second paper");
      expect(links[1]).toHaveTextContent("First paper");
    });

    // 2. Move paper-1 UP (index 1 -> 0) - this will fail on API
    fireEvent.click(screen.getAllByRole("button", { name: "上に移動" })[1]);

    await waitFor(() => {
      // It sets the error message
      expect(screen.getByText("並べ替えに失敗しました")).toBeInTheDocument();
    });
  });
});
