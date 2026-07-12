import { describe, it, expect } from "vitest";
import { ID_MAX_LENGTH } from "../constants";

describe("constants", () => {
  it("ID_MAX_LENGTH should be 128", () => {
    expect(ID_MAX_LENGTH).toBe(128);
  });
});
