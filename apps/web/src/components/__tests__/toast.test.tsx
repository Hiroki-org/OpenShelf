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
    const { container } = render(<ToastContainer />);
    const toastWrapper = container.firstChild;

    expect(toastWrapper).toHaveAttribute("aria-live", "polite");
    expect(toastWrapper).not.toHaveAttribute("aria-atomic");
  });

  it("toasts have correct roles based on type", () => {
    render(<ToastContainer />);

    act(() => {
      toast.success("success message");
      toast.error("error message");
    });

    const successToast = screen.getAllByText("success message")[0];
    const errorToast = screen.getAllByText("error message")[0];

    expect(successToast).toHaveAttribute("role", "status");
    expect(errorToast).toHaveAttribute("role", "alert");
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
