import { jest } from "@jest/globals";
import mockWebhookComposer from "../../../../test/mockWebhookComposer.js";
import mockTransaction from "../../../../test/mockTransaction.js";

jest.useFakeTimers();
const runMacros = jest.fn();
const evaluatingFunctions = {
  direction: jest.fn(),
  amount: jest.fn(),
  text: jest.fn(),
  call: jest.fn(),
};
const db = { getAllRules: jest.fn() };
const logger = { log: jest.fn().mockName("logger.log") };

const processTransaction = mockWebhookComposer({
  runMacros,
  evaluatingFunctions,
  db,
  logger,
}).processTransaction;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const mockProcessTransaction = async (transaction, rules, mockValues) => {
  const callTypeFilter = mockValues.find((mock) => mock.func == "call");
  if (!callTypeFilter) {
    evaluatingFunctions.call.mockReturnValueOnce(true);
  }
  for (const mock of mockValues) {
    const { func, value } = mock;
    evaluatingFunctions[func].mockReturnValueOnce(value);
  }
  db.getAllRules.mockReturnValue(rules);
  await processTransaction(mockTransaction);
  await Promise.resolve();
};

describe("runs rules for transaction", () => {
  it("logs rule passed if no rules and call type is created", async () => {
    await mockProcessTransaction(
      mockTransaction,
      [{ name: "rule1", filters: [] }],
      [{ func: "call", value: true }]
    );
    expect(logger.log.mock.calls[0][0]).toBe(
      `Rule rule1 PASSED for ${mockTransaction.description}`
    );
    expect(logger.log.mock.calls[0][1]).toBe(mockTransaction.id);
  });
  it("calls runMacros if no rules and call type is created", async () => {
    await mockProcessTransaction(
      mockTransaction,
      [{ name: "rule1", filters: [], macros: [{ name: "macro1" }] }],
      [{ func: "call", value: true }]
    );
    expect(runMacros).toHaveBeenCalled();
    expect(runMacros.mock.calls[0]).toEqual([
      [{ name: "macro1" }],
      mockTransaction,
    ]);
  });
  it.each([
    {
      filters: [],
      mocks: [{ func: "call", value: false }],
      run: "doesn't",
      description: "no filters and call type updated",
    },
    {
      filters: [{ type: "direction", direction: "in" }],
      mocks: [{ func: "direction", value: true }],
      run: "does",
      description: "direction filter passes",
    },
    {
      filters: [{ type: "direction", direction: "in" }],
      mocks: [{ func: "direction", value: false }],
      run: "doesn't",
      description: "direction filter fails",
    },
    {
      filters: [{ type: "amount", test: "gte", value: 100 }],
      mocks: [{ func: "amount", value: true }],
      run: "does",
      description: "amount filter passes",
    },
    {
      filters: [{ type: "amount", test: "gte", value: 100 }],
      mocks: [{ func: "amount", value: false }],
      run: "doesn't",
      description: "amount filter fails",
    },
    {
      filters: [{ type: "text", field: "description", pattern: "pot" }],
      mocks: [{ func: "text", value: true }],
      run: "does",
      description: "text filter passes",
    },
    {
      filters: [{ type: "text", field: "description", pattern: "pot" }],
      mocks: [{ func: "text", value: false }],
      run: "doesn't",
      description: "text filter fails",
    },
    {
      filters: [
        { type: "text", field: "description", pattern: "pot" },
        { type: "amount", test: "gte", value: 100 },
      ],
      mocks: [
        { func: "text", value: true },
        { func: "amount", value: true },
      ],
      run: "does",
      description: "text and amount filters pass",
    },
    {
      filters: [
        { type: "text", field: "description", pattern: "pot" },
        { type: "amount", test: "gte", value: 100 },
      ],
      mocks: [
        { func: "text", value: false },
        { func: "amount", value: true },
      ],
      run: "doesn't",
      description: "text filter fails and amount filter passes",
    },
    {
      filters: [
        { type: "text", field: "description", pattern: "pot" },
        { type: "amount", test: "gte", value: 100 },
      ],
      mocks: [
        { func: "text", value: true },
        { func: "amount", value: false },
      ],
      run: "doesn't",
      description: "text filter passes and amount filter fails",
    },
    {
      filters: [
        { type: "text", field: "description", pattern: "pot" },
        { type: "amount", test: "gte", value: 100 },
      ],
      mocks: [
        { func: "text", value: false },
        { func: "amount", value: false },
      ],
      run: "doesn't",
      description: "text and amount filters fail",
    },
  ])(
    "$run run macros when $description",
    async ({ filters, mocks, run, description }) => {
      await mockProcessTransaction(
        mockTransaction,
        [{ name: "rule1", filters, macros: [{ name: "macro1" }] }],
        mocks
      );
      if (run == "does") {
        expect(runMacros).toHaveBeenCalled();
      } else {
        expect(runMacros).not.toHaveBeenCalled();
      }
    }
  );
});
