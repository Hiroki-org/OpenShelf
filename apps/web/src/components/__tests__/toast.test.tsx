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
    expect(screen.getByText("saved")).toHaveAttribute("role", "status");
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toHaveAttribute("role", "alert");
    expect(screen.getByText("fyi")).toBeInTheDocument();
    expect(screen.getByText("fyi")).toHaveAttribute("role", "status");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("saved")).not.toBeInTheDocument();
    expect(screen.queryByText("failed")).not.toBeInTheDocument();
    expect(screen.queryByText("fyi")).not.toBeInTheDocument();

    unmount();
  });

  it("uses randomUUID when available", () => {
    const mockUUID = "123e4567-e89b-12d3-a456-426614174000";
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(mockUUID),
    });
    const { unmount } = render(<ToastContainer />);

    act(() => {
      toast.success("uuid-test");
    });

    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(screen.getByText("uuid-test")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    unmount();
  });

  it("uses getRandomValues fallback when randomUUID is unavailable", () => {
    const mockGetRandomValues = vi.fn().mockImplementation((arr: Uint32Array) => {
      arr.set([12345, 67890, 13579, 24680]);
      return arr;
    });
    vi.stubGlobal("crypto", {
      getRandomValues: mockGetRandomValues
    });
    const { unmount } = render(<ToastContainer />);

    act(() => {
      toast.info("fallback-test-1");
    });

    expect(mockGetRandomValues).toHaveBeenCalled();
    expect(mockGetRandomValues.mock.calls[0][0]).toHaveLength(4);
    expect(screen.getByText("fallback-test-1")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    unmount();
  });

  it("uses Date fallback when crypto is completely unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    const { unmount } = render(<ToastContainer />);

    act(() => {
      toast.error("fallback-test-2");
    });

    expect(screen.getByText("fallback-test-2")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    unmount();
  });

  it("falls back when crypto methods throw", () => {
    const randomUUID = vi.fn(() => {
      throw new Error("randomUUID unavailable");
    });
    const getRandomValues = vi.fn(() => {
      throw new Error("getRandomValues unavailable");
    });
    vi.stubGlobal("crypto", { randomUUID, getRandomValues });
    const { unmount } = render(<ToastContainer />);

    expect(() => {
      act(() => {
        toast.success("exception-fallback");
      });
    }).not.toThrow();

    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(screen.getByText("exception-fallback")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
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
});
