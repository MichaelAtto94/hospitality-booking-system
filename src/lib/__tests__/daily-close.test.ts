import { describe, expect, it } from "vitest";
import { calculateClose, zambiaDayRange } from "../daily-close";

const methods = {
  CASH: 1200,
  CARD: 500,
  BANK_TRANSFER: 800,
  MTN_MOBILE_MONEY: 1000,
  AIRTEL_MONEY: 400,
  ZAMTEL_KWACHA: 100,
};

describe("end-of-day financial closing", () => {
  it("totals every payment channel", () => {
    const result = calculateClose(methods, 200, 300, 1150);
    expect(result.gross).toBe(4000);
    expect(result.net).toBe(3500);
  });

  it("reconciles physical cash", () => {
    const result = calculateClose(methods, 0, 0, 1150);
    expect(result.expectedCash).toBe(1200);
    expect(result.variance).toBe(-50);
  });

  it("deducts cash refunds and cash expenses from drawer expectation", () => {
    const result = calculateClose(methods, 100, 250, 850, 350);
    expect(result.expectedCash).toBe(850);
    expect(result.variance).toBe(0);
  });

  it("uses Zambia midnight boundaries", () => {
    const range = zambiaDayRange("2026-08-11");
    expect(range.start.toISOString()).toBe("2026-08-10T22:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-11T22:00:00.000Z");
  });

  it("rejects malformed dates", () => {
    expect(() => zambiaDayRange("11/08/2026")).toThrow("INVALID_DATE");
  });
});
