import { jest } from "@jest/globals";
import evaluatingFunctions from "./filterEvaluatingFunctions.js";
import mockTransaction from "../../../../test/mockTransaction.js";

jest.useFakeTimers();

describe("direction filter", () => {
  const { direction } = evaluatingFunctions;
  it("it returns true when amount is positive and direction is in", () => {
    const transaction = { ...mockTransaction, amount: 100 };
    const filter = { type: "direction", direction: "in" };
    const result = direction(filter, transaction);
    expect(result).toBe(true);
  });
  it("it returns false when amount is negative and direction is in", () => {
    const transaction = { ...mockTransaction, amount: -100 };
    const filter = { type: "direction", direction: "in" };
    const result = direction(filter, transaction);
    expect(result).toBe(false);
  });
  it("it returns false when amount is 0 and direction is in", () => {
    const transaction = { ...mockTransaction, amount: 0 };
    const filter = { type: "direction", direction: "in" };
    const result = direction(filter, transaction);
    expect(result).toBe(false);
  });
  it("it returns false when amount is positive and direction is out", () => {
    const transaction = { ...mockTransaction, amount: 100 };
    const filter = { type: "direction", direction: "out" };
    const result = direction(filter, transaction);
    expect(result).toBe(false);
  });
  it("it returns true when amount is negative and direction is out", () => {
    const transaction = { ...mockTransaction, amount: -100 };
    const filter = { type: "direction", direction: "out" };
    const result = direction(filter, transaction);
    expect(result).toBe(true);
  });
  it("it returns false when amount is 0 and direction is out", () => {
    const transaction = { ...mockTransaction, amount: 0 };
    const filter = { type: "direction", direction: "out" };
    const result = direction(filter, transaction);
    expect(result).toBe(false);
  });
});
