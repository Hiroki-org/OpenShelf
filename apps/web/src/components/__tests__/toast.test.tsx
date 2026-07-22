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
    expect(toastWrapper).not.toHaveAttribute("role", "status");
    expect(toastWrapper).not.toHaveAttribute("aria-atomic");
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

  describe("addToast ID generation", () => {
    let originalCrypto: any;

    beforeEach(() => {
      originalCrypto = globalThis.crypto;
    });

    afterEach(() => {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it("uses crypto.randomUUID when available", () => {
      const mockUUID = "mock-uuid-1234";
      Object.defineProperty(globalThis, "crypto", {
        value: { randomUUID: vi.fn(() => mockUUID) },
        writable: true,
        configurable: true,
      });

      render(<ToastContainer />);
      act(() => {
        toast.success("test crypto");
      });

      expect(globalThis.crypto.randomUUID).toHaveBeenCalled();
    });

    it("uses crypto.getRandomValues when randomUUID is unavailable", () => {
      const getRandomValues = vi.fn((bytes: Uint8Array) => {
        bytes.fill(0xab);
        return bytes;
      });
      Object.defineProperty(globalThis, "crypto", {
        value: { getRandomValues },
        writable: true,
        configurable: true,
      });

      render(<ToastContainer />);
      act(() => {
        toast.success("test secure fallback");
      });

      expect(getRandomValues).toHaveBeenCalledOnce();
    });

    it("does not use Math.random when crypto is unavailable", () => {
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const mathRandomSpy = vi.spyOn(Math, "random");

      render(<ToastContainer />);
      act(() => {
        toast.success("test deterministic fallback");
      });

      expect(mathRandomSpy).not.toHaveBeenCalled();
      mathRandomSpy.mockRestore();
    });
  });
