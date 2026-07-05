import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastContainer, toast } from "../toast";

describe("toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders and auto-removes toast messages", () => {
    render(<ToastContainer />);

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
  });

  it("ToastContainer has correct accessibility attributes", () => {
    render(<ToastContainer />);

    act(() => {
      toast.success("saved");
      toast.error("failed");
    });

    const successToast = screen.getByText("saved");
    expect(successToast).toHaveAttribute("role", "status");
    expect(successToast).not.toHaveAttribute("aria-live");
    expect(successToast).not.toHaveAttribute("aria-atomic");

    const errorToast = screen.getByText("failed");
    expect(errorToast).toHaveAttribute("role", "alert");
    expect(errorToast).not.toHaveAttribute("aria-live");
    expect(errorToast).not.toHaveAttribute("aria-atomic");
  });

  it("renders when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {});
    render(<ToastContainer />);

    act(() => {
      toast.info("fallback id");
    });

    expect(screen.getByText("fallback id")).toHaveAttribute("role", "status");
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
