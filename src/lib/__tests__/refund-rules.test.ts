import { describe, expect, it } from "vitest";
import { isFullRefund, refundableBalance } from "../refund-rules";

describe("refund controls", () => {
  it("calculates the remaining refundable amount", () => {
    expect(refundableBalance(10000, 2500)).toBe(7500);
  });

  it("never returns a negative refundable balance", () => {
    expect(refundableBalance(1000, 1200)).toBe(0);
  });

  it("recognises a complete refund", () => {
    expect(isFullRefund(10000, 10000)).toBe(true);
    expect(isFullRefund(10000, 4000)).toBe(false);
  });
});
