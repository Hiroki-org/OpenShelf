import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastContainer, toast } from "../toast";

describe("toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders and auto-removes toast messages", () => {
    const { unmount } = render(<ToastContainer />);

    act(() => {
      toast.success("saved");
      toast.error("failed");
      toast.info("fyi");
    });

    expect(screen.getByText("saved")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("fyi")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("saved")).not.toBeInTheDocument();
    expect(screen.queryByText("failed")).not.toBeInTheDocument();
    expect(screen.queryByText("fyi")).not.toBeInTheDocument();
    unmount();
  });

  it("ToastContainer has correct accessibility attributes", () => {
    const { container, unmount } = render(<ToastContainer />);
    const toastWrapper = container.firstChild;

    expect(toastWrapper).toHaveAttribute("aria-live", "polite");
    expect(toastWrapper).not.toHaveAttribute("role", "status");
    expect(toastWrapper).not.toHaveAttribute("aria-atomic");
    unmount();
  });

  it("removes listener on unmount", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount, container } = render(<ToastContainer />);
    unmount();

    act(() => {
      toast.success("should not error");
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe("");

    consoleSpy.mockRestore();
  });
  it("generates ID using crypto.getRandomValues if randomUUID is missing", () => {
    const mockGetRandomValues = vi.fn((arr) => {
      arr[0] = 123456789;
      return arr;
    });
    vi.stubGlobal('crypto', { getRandomValues: mockGetRandomValues });

    const { unmount } = render(<ToastContainer />);
    act(() => {
      toast.success("secure-fallback");
    });
    expect(screen.getByText("secure-fallback")).toBeInTheDocument();
    expect(mockGetRandomValues).toHaveBeenCalled();
    unmount();
  });

  it("generates ID using Math.random fallback if crypto is completely missing", () => {
    vi.stubGlobal('crypto', undefined);

    const { unmount } = render(<ToastContainer />);
    act(() => {
      toast.success("math-fallback");
    });
    expect(screen.getByText("math-fallback")).toBeInTheDocument();
    unmount();
  });
});
