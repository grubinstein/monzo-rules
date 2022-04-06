import { jest } from "@jest/globals";
import evaluatingFunctions from "./filterEvaluatingFunctions.js";
import mockTransaction from "../../../../test/mockTransaction.js";

jest.useFakeTimers();

describe("direction filter", () => {
  const { direction: directionFilter } = evaluatingFunctions;
  const runDirectionFilter = (amount, direction) => {
    const transaction = { ...mockTransaction, amount };
    const filter = { type: "direction", direction };
    return directionFilter(filter, transaction);
  };
  it("it returns true when amount is positive and direction is in", () => {
    const result = runDirectionFilter(100, "in");
    expect(result).toBe(true);
  });
  it("it returns false when amount is negative and direction is in", () => {
    const result = runDirectionFilter(-100, "in");
    expect(result).toBe(false);
  });
  it("it returns false when amount is 0 and direction is in", () => {
    const result = runDirectionFilter(0, "in");
    expect(result).toBe(false);
  });
  it("it returns false when amount is positive and direction is out", () => {
    const result = runDirectionFilter(100, "out");
    expect(result).toBe(false);
  });
  it("it returns true when amount is negative and direction is out", () => {
    const result = runDirectionFilter(-100, "out");
    expect(result).toBe(true);
  });
  it("it returns false when amount is 0 and direction is out", () => {
    const result = runDirectionFilter(0, "out");
    expect(result).toBe(false);
  });
});

describe("amount filter", () => {
  const { amount: amountFilter } = evaluatingFunctions;
  const runAmountFilter = (amount, test, value) => {
    const transaction = { ...mockTransaction, amount };
    const filter = { type: "amount", test, value };
    return amountFilter(filter, transaction);
  };
  it("throws an error when filter value is negative", () => {
    const runWithNegativeFilterValue = () => runAmountFilter(25, "gte", -50);
    expect(runWithNegativeFilterValue).toThrowError(
      "Filter value must be greater than or equal to 0"
    );
  });
  it("returns true for gte test with larger value", () => {
    const result = runAmountFilter(100, "gte", 50);
    expect(result).toBe(true);
  });
  it("returns true for gte test with larger negative value", () => {
    const result = runAmountFilter(-100, "gte", 50);
    expect(result).toBe(true);
  });
  it("returns true for gte test with equal value", () => {
    const result = runAmountFilter(50, "gte", 50);
    expect(result).toBe(true);
  });
  it("returns true for gte test with equal negative value", () => {
    const result = runAmountFilter(-50, "gte", 50);
    expect(result).toBe(true);
  });
  it("returns false for gte test with smaller value", () => {
    const result = runAmountFilter(25, "gte", 50);
    expect(result).toBe(false);
  });
  it("returns false for gte test with smaller negative value", () => {
    const result = runAmountFilter(25, "gte", 50);
    expect(result).toBe(false);
  });
  it("returns true for gt test with larger value", () => {
    const result = runAmountFilter(100, "gt", 50);
    expect(result).toBe(true);
  });
  it("returns true for gt test with larger negative value", () => {
    const result = runAmountFilter(-100, "gt", 50);
    expect(result).toBe(true);
  });
  it("returns false for gt test with equal value", () => {
    const result = runAmountFilter(50, "gt", 50);
    expect(result).toBe(false);
  });
  it("returns false for gt test with equal negative value", () => {
    const result = runAmountFilter(-50, "gt", 50);
    expect(result).toBe(false);
  });
  it("returns false for gt test with smaller value", () => {
    const result = runAmountFilter(25, "gt", 50);
    expect(result).toBe(false);
  });
  it("returns false for gt test with smaller negative value", () => {
    const result = runAmountFilter(-25, "gt", 50);
    expect(result).toBe(false);
  });
  it("returns false for lte test with larger value", () => {
    const result = runAmountFilter(100, "lte", 50);
    expect(result).toBe(false);
  });
  it("returns false for lte test with larger negative value", () => {
    const result = runAmountFilter(-100, "lte", 50);
    expect(result).toBe(false);
  });
  it("returns true for lte test with equal value", () => {
    const result = runAmountFilter(50, "lte", 50);
    expect(result).toBe(true);
  });
  it("returns true for lte test with equal negative value", () => {
    const result = runAmountFilter(-50, "lte", 50);
    expect(result).toBe(true);
  });
  it("returns true for lte test with smaller value", () => {
    const result = runAmountFilter(25, "lte", 50);
    expect(result).toBe(true);
  });
  it("returns true for lte test with smaller negative value", () => {
    const result = runAmountFilter(25, "lte", 50);
    expect(result).toBe(true);
  });
  it("returns false for lt test with larger value", () => {
    const result = runAmountFilter(100, "lt", 50);
    expect(result).toBe(false);
  });
  it("returns false for lt test with larger negative value", () => {
    const result = runAmountFilter(-100, "lt", 50);
    expect(result).toBe(false);
  });
  it("returns false for lt test with equal value", () => {
    const result = runAmountFilter(50, "lt", 50);
    expect(result).toBe(false);
  });
  it("returns false for lt test with equal negative value", () => {
    const result = runAmountFilter(-50, "lt", 50);
    expect(result).toBe(false);
  });
  it("returns true for lt test with smaller value", () => {
    const result = runAmountFilter(-25, "lt", 50);
    expect(result).toBe(true);
  });
  it("returns true for lt test with smaller negative value", () => {
    const result = runAmountFilter(25, "lt", 50);
    expect(result).toBe(true);
  });
  it("returns true for equal test with equal value", () => {
    const result = runAmountFilter(50, "equal", 50);
    expect(result).toBe(true);
  });
  it("returns true for equal test with negative equal value", () => {
    const result = runAmountFilter(-50, "equal", 50);
    expect(result).toBe(true);
  });
  it("returns false for equal test with unequal value", () => {
    const result = runAmountFilter(49, "equal", 50);
    expect(result).toBe(false);
  });
});

describe("text filter", () => {
  const { text } = evaluatingFunctions;
  const runTextFilter = (
    mockTransactionEdits,
    field,
    pattern,
    caseInsensitive
  ) => {
    const transaction = { ...mockTransaction, ...mockTransactionEdits };
    const filter = { type: "text", field, pattern, caseInsensitive };
    return text(filter, transaction);
  };
  it("returns true for an exact match", () => {
    const result = runTextFilter(
      { description: "this text" },
      "description",
      "this text"
    );
    expect(result).toBe(true);
  });
  it("returns true when pattern begins field", () => {
    const result = runTextFilter(
      { description: "this text" },
      "description",
      "this*"
    );
    expect(result).toBe(true);
  });
  it("returns true when patten ends field", () => {
    const result = runTextFilter(
      { description: "this text" },
      "description",
      "*text"
    );
    expect(result).toBe(true);
  });
  it("allows wildcards to match empty strings", () => {
    const result = runTextFilter(
      { description: "this text" },
      "description",
      "*this text*"
    );
    expect(result).toBe(true);
  });
  it("supports wildcards mide string", () => {
    const result = runTextFilter(
      { description: "this text" },
      "description",
      "thi*ext"
    );
    expect(result).toBe(true);
  });
  it("returns false for incomplete pattern without wildcards", () => {
    const result = runTextFilter(
      { description: "this text" },
      "description",
      "this"
    );
    expect(result).toBe(false);
  });
  it("finds values using paths with .", () => {
    const result = runTextFilter(
      { metadata: { external_id: "this text" } },
      "metadata.external_id",
      "*hi*xt"
    );
    expect(result).toBe(true);
  });
  it("allows * to be escaped with \\ and passes when it should", () => {
    // Reads: allows * to be escaped with \
    const result = runTextFilter(
      { description: "this*text" },
      "description",
      `this\\\*text`
    );
    // Description: "this*text"
    // Pattern: "this\*text"
    expect(result).toBe(true);
  });
  it("allows * to be escaped with \\ and fails when it should", () => {
    // Reads: allows * to be escaped with \
    const result = runTextFilter(
      { description: `this\\ksjtext` },
      "description",
      `this\\\*text`
    );
    // Description: "this\ksjtext"
    // Pattern: "this\*text"
    expect(result).toBe(false);
  });
  it("allows \\* to be escaped as \\\\* and matches \\ followed by anything", () => {
    // Reads: allows \* to be escaped as \\* and matches \ followed by anything
    const result = runTextFilter(
      { description: `this\\text` },
      "description",
      `this\\\\*t`
    );
    // Description: "this\text"
    // Pattern: "this\\*"
    expect(result).toBe(true);
  });
  it("allows a mix of \\* and \\\\*", () => {
    // Reads: allows a mix of \* and \\* in pattern
    // \* should match *
    // \\* should match \ followed by anything
    const result = runTextFilter(
      {
        description: `this is an asterix * and this \\ is a backslash`,
      },
      "description",
      `this is an asterix \\\* and this \\\\* backslash`
    );
    // Description: "this is an asterix * and this \ is a backslash"
    // Pattern: "this is an asterix \* and this \\* backslash"
    expect(result).toBe(true);
  });
  it("treats \\\\ alone as normal, does not escape to \\", () => {
    // Reads: treats \\ alone as normal
    const result = runTextFilter(
      { description: `this \\\\ is two backslahes` },
      "description",
      `this \\\\ is two backslahes`
    );
    // Description: "this \\ is two backslashes"
    // Pattern: "this \\ is two backslashes"
    expect(result).toBe(true);
  });
  it("allows case insensitive matching", () => {
    const result = runTextFilter(
      { description: "ThIs text" },
      "description",
      "tHi*Ext",
      true
    );
    expect(result).toBe(true);
  });
  it("returns false if top level field path does not resolve", () => {
    const result = runTextFilter({}, "non-existentField", "some text");
    expect(result).toBe(false);
  });
  it("returns false if top level field path does not resolve", () => {
    const result = runTextFilter({}, "non.existentField", "some text");
    expect(result).toBe(false);
  });
});

describe("call type filter", () => {
  const { call } = evaluatingFunctions;
  const callFilter = call;
  const runCallFilter = (callType, callFilterValue) => {
    const transaction = { ...mockTransaction, callType };
    const filter = {
      type: "call",
      call: callFilterValue,
    };
    return callFilter(filter, transaction);
  };
  it("returns true when call = any and call type is created", () => {
    const result = runCallFilter("transaction.created", "any");
    expect(result).toBe(true);
  });
  it("returns true when call = any and call type is updated", () => {
    const result = runCallFilter("transaction.updated", "any");
    expect(result).toBe(true);
  });
  it("returns true when call = created and call type is created", () => {
    const result = runCallFilter("transaction.created", "created");
    expect(result).toBe(true);
  });
  it("returns false when call = created and call type is updated", () => {
    const result = runCallFilter("transaction.updated", "created");
    expect(result).toBe(false);
  });
  it("returns true when call = updated and call type is updated", () => {
    const result = runCallFilter("transaction.updated", "updated");
    expect(result).toBe(true);
  });
  it("returns false when call = updated and call type is created", () => {
    const result = runCallFilter("transaction.created", "updated");
    expect(result).toBe(false);
  });
  it("throws an error if call is something else", () => {
    const runFilter = () => runCallFilter("transaction.created", "something");
    expect(runFilter).toThrowError("Invalid call type");
  });
});
