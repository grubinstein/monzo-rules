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

describe("amount filter", () => {
  const { amount } = evaluatingFunctions;
  it("throws an error when filter value is negative", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "gte", value: -50 };
    const runWithNegativeFilterValue = () => amount(filter, transaction);
    expect(runWithNegativeFilterValue).toThrowError(
      "Filter value must be greater than or equal to 0"
    );
  });
  it("returns true for gte test with larger value", () => {
    const transaction = { ...mockTransaction, amount: 100 };
    const filter = { type: "amount", test: "gte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for gte test with larger negative value", () => {
    const transaction = { ...mockTransaction, amount: -100 };
    const filter = { type: "amount", test: "gte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for gte test with equal value", () => {
    const transaction = { ...mockTransaction, amount: 50 };
    const filter = { type: "amount", test: "gte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for gte test with equal negative value", () => {
    const transaction = { ...mockTransaction, amount: -50 };
    const filter = { type: "amount", test: "gte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false for gte test with smaller value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "gte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for gte test with smaller negative value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "gte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns true for gt test with larger value", () => {
    const transaction = { ...mockTransaction, amount: 100 };
    const filter = { type: "amount", test: "gt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for gt test with larger negative value", () => {
    const transaction = { ...mockTransaction, amount: -100 };
    const filter = { type: "amount", test: "gt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false for gt test with equal value", () => {
    const transaction = { ...mockTransaction, amount: 50 };
    const filter = { type: "amount", test: "gt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for gt test with equal negative value", () => {
    const transaction = { ...mockTransaction, amount: -50 };
    const filter = { type: "amount", test: "gt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for gt test with smaller value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "gt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for gt test with smaller negative value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "gt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for lte test with larger value", () => {
    const transaction = { ...mockTransaction, amount: 100 };
    const filter = { type: "amount", test: "lte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for lte test with larger negative value", () => {
    const transaction = { ...mockTransaction, amount: -100 };
    const filter = { type: "amount", test: "lte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns true for lte test with equal value", () => {
    const transaction = { ...mockTransaction, amount: 50 };
    const filter = { type: "amount", test: "lte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for lte test with equal negative value", () => {
    const transaction = { ...mockTransaction, amount: -50 };
    const filter = { type: "amount", test: "lte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for lte test with smaller value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "lte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for lte test with smaller negative value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "lte", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false for lt test with larger value", () => {
    const transaction = { ...mockTransaction, amount: 100 };
    const filter = { type: "amount", test: "lt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for lt test with larger negative value", () => {
    const transaction = { ...mockTransaction, amount: -100 };
    const filter = { type: "amount", test: "lt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for lt test with equal value", () => {
    const transaction = { ...mockTransaction, amount: 50 };
    const filter = { type: "amount", test: "lt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns false for lt test with equal negative value", () => {
    const transaction = { ...mockTransaction, amount: -50 };
    const filter = { type: "amount", test: "lt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns true for lt test with smaller value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "lt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for lt test with smaller negative value", () => {
    const transaction = { ...mockTransaction, amount: 25 };
    const filter = { type: "amount", test: "lt", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for equal test with equal value", () => {
    const transaction = { ...mockTransaction, amount: 50 };
    const filter = { type: "amount", test: "equal", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true for equal test with negative equal value", () => {
    const transaction = { ...mockTransaction, amount: -50 };
    const filter = { type: "amount", test: "equal", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false for equal test with unequal value", () => {
    const transaction = { ...mockTransaction, amount: 49 };
    const filter = { type: "amount", test: "equal", value: 50 };
    const result = amount(filter, transaction);
    expect(result).toBe(false);
  });
});

describe("text filter", () => {
  const { text } = evaluatingFunctions;
  it("returns true for an exact match", () => {
    const transaction = { ...mockTransaction, description: "this text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "this text",
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true when pattern begins field", () => {
    const transaction = { ...mockTransaction, description: "this text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "this*",
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true when patten ends field", () => {
    const transaction = { ...mockTransaction, description: "this text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "*text",
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("allows wildcards to match empty strings", () => {
    const transaction = { ...mockTransaction, description: "this text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "*this text*",
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("supports wildcards mide string", () => {
    const transaction = { ...mockTransaction, description: "this text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "thi*ext",
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false for incomplete pattern without wildcards", () => {
    const transaction = { ...mockTransaction, description: "this text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "this",
    };
    const result = text(filter, transaction);
    expect(result).toBe(false);
  });
  it("finds values using paths with .", () => {
    const transaction = { ...mockTransaction };
    transaction.metadata.external_id = "this text";
    const filter = {
      type: "text",
      field: "metadata.external_id",
      pattern: "*hi*xt",
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("allows * to be escaped with \\ and passes when it should", () => {
    const transaction = { ...mockTransaction, description: "this*text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: `this\\\*text`,
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("allows * to be escaped with \\ and fails when it should", () => {
    const transaction = { ...mockTransaction, description: `this\\*text` };
    const filter = {
      type: "text",
      field: "description",
      pattern: `this\\\*text`,
    };
    const result = text(filter, transaction);
    expect(result).toBe(false);
  });
  it("allows \\* to be escaped as \\\\*", () => {
    const transaction = { ...mockTransaction, description: `this\\*text` };
    const filter = {
      type: "text",
      field: "description",
      pattern: `this\\\\\*text`,
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
  it("allows case insensitive matching", () => {
    const transaction = { ...mockTransaction, description: "ThIs text" };
    const filter = {
      type: "text",
      field: "description",
      pattern: "tHi*Ext",
      caseInsensitive: true,
    };
    const result = text(filter, transaction);
    expect(result).toBe(true);
  });
});

describe("call type filter", () => {
  const { call } = evaluatingFunctions;
  it("returns true when call = any and call type is created", () => {
    const transaction = { ...mockTransaction, callType: "transaction.created" };
    const filter = {
      type: "call",
      call: "any",
    };
    const result = call(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true when call = any and call type is updated", () => {
    const transaction = { ...mockTransaction, callType: "transaction.updated" };
    const filter = {
      type: "call",
      call: "any",
    };
    const result = call(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns true when call = created and call type is created", () => {
    const transaction = { ...mockTransaction, callType: "transaction.created" };
    const filter = {
      type: "call",
      call: "created",
    };
    const result = call(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false when call = created and call type is updated", () => {
    const transaction = { ...mockTransaction, callType: "transaction.updated" };
    const filter = {
      type: "call",
      call: "created",
    };
    const result = call(filter, transaction);
    expect(result).toBe(false);
  });
  it("returns true when call = updated and call type is updated", () => {
    const transaction = { ...mockTransaction, callType: "transaction.updated" };
    const filter = {
      type: "call",
      call: "updated",
    };
    const result = call(filter, transaction);
    expect(result).toBe(true);
  });
  it("returns false when call = updated and call type is created", () => {
    const transaction = { ...mockTransaction, callType: "transaction.created" };
    const filter = {
      type: "call",
      call: "updated",
    };
    const result = call(filter, transaction);
    expect(result).toBe(false);
  });
  it("throws an error if call is something else", () => {
    const transaction = { ...mockTransaction, callType: "transaction.created" };
    const filter = {
      type: "call",
      call: "something",
    };
    const runFilter = () => call(filter, transaction);
    expect(runFilter).toThrowError("Invalid call type");
  });
});
