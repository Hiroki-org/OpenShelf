import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastContainer, toast } from "../toast";

describe("toast", () => {
  let originalCrypto: Crypto | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      value: {
        randomUUID: () => `mock-uuid-${Math.random().toString().slice(2, 8)}`,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    } else {
      delete (globalThis as any).crypto;
    }
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

  it("uses fallback id generation when crypto.randomUUID is not available", () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    delete (globalThis.crypto as any).randomUUID;

    const { unmount } = render(<ToastContainer />);
    act(() => {
      toast.success("fallback test");
    });

    expect(screen.getByText("fallback test")).toBeInTheDocument();

    unmount();
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: originalRandomUUID,
      configurable: true,
    });
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