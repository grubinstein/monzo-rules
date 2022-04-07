import { jest } from "@jest/globals";
import mockWebhookComposer from "../../../test/mockWebhookComposer.js";
import mockTransaction from "../../../test/mockTransaction.js";

jest.useFakeTimers();
const runMacros = jest.fn();
const evaluatingFunctions = {
  direction: jest.fn(),
  amount: jest.fn(),
  text: jest.fn(),
  call: jest.fn(),
};
const db = {
  getAllRules: jest.fn(),
  getUserByAccountId: jest.fn(),
};
const logger = { log: jest.fn().mockName("logger.log") };

const processTransaction = mockWebhookComposer({
  runMacros,
  evaluatingFunctions,
  db,
  logger,
}).processTransaction;

const mockUser = {
  accessToken: "abc123",
  refreshToken: "123abc",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const mockProcessTransaction = async (transaction, rules, mockValues) => {
  const callTypeFilter =
    mockValues && mockValues.find((mock) => mock.func == "call");
  if (!callTypeFilter) {
    evaluatingFunctions.call.mockReturnValue(true);
  }
  if (mockValues) {
    for (const mock of mockValues) {
      const { func, value } = mock;
      evaluatingFunctions[func].mockReturnValueOnce(value);
    }
  }
  db.getAllRules.mockReturnValue(rules);
  db.getUserByAccountId.mockReturnValue(mockUser);
  await Promise.resolve();
  await processTransaction(transaction);
  await Promise.resolve();
};

describe("runs rules for transaction", () => {
  it("calls evaluating function with filter and transaction until one fails", async () => {
    await mockProcessTransaction(
      mockTransaction,
      [
        {
          name: "rule1",
          filters: [
            { type: "direction" },
            { type: "text" },
            { type: "amount" },
            { type: "call" },
          ],
        },
      ],
      [
        { func: "direction", value: true },
        { func: "text", value: true },
        { func: "amount", value: false },
        { func: "call", value: true },
      ]
    );
    expect(evaluatingFunctions.direction.mock.calls[0]).toEqual([
      { type: "direction" },
      mockTransaction,
    ]);
    expect(evaluatingFunctions.text.mock.calls[0]).toEqual([
      { type: "text" },
      mockTransaction,
    ]);
    expect(evaluatingFunctions.amount.mock.calls[0]).toEqual([
      { type: "amount" },
      mockTransaction,
    ]);
    expect(evaluatingFunctions.call).not.toHaveBeenCalled();
  });
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
  it("calls runMacros with macros, transaction and user if no rules and call type is created", async () => {
    await mockProcessTransaction(
      mockTransaction,
      [
        {
          name: "rule1",
          filters: [],
          macros: [{ name: "macro1" }, { name: "macro2" }],
        },
      ],
      [{ func: "call", value: true }]
    );
    expect(runMacros).toHaveBeenCalled();
    expect(runMacros.mock.calls[0]).toEqual([
      [{ name: "macro1" }, { name: "macro2" }],
      mockTransaction,
      mockUser,
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
      description: "single non-call filter passes",
    },
    {
      filters: [{ type: "direction", direction: "in" }],
      mocks: [{ func: "direction", value: false }],
      run: "doesn't",
      description: "single non-call filter fails",
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
      description: "two filters pass",
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
      description: "first filter fails and second passes",
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
      description: "first filter passes and second fails",
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
      description: "two filters fails",
    },
    {
      filters: [
        { type: "direction", direction: "in" },
        { type: "direction", direction: "out" },
      ],
      mocks: [
        { func: "direction", value: false },
        { func: "direction", value: true },
      ],
      run: "doesn't",
      description: "two filters conflict",
    },
    {
      filters: [{ type: "call", call: "updated" }],
      mocks: [{ func: "call", value: false }],
      run: "doesn't",
      description: "custom call filter fails",
    },
    {
      filters: [{ type: "call", call: "updated" }],
      mocks: [{ func: "call", value: true }],
      run: "does",
      description: "custom call filter passes",
    },
  ])("$run run macros when $description", async ({ filters, mocks, run }) => {
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
  });
  it("runs macros for passing rules only when only second rule passes", async () => {
    await mockProcessTransaction(
      mockTransaction,
      [
        {
          name: "rule1",
          filters: [{ type: "direction", direction: "in" }],
          macros: [{ name: "macro1" }],
        },
        {
          name: "rule2",
          filters: [{ type: "amount", test: "gt", value: 200 }],
          macros: [{ name: "macro2" }],
        },
      ],
      [
        { func: "direction", value: false },
        { func: "amount", value: true },
      ]
    );
    await Promise.resolve();
    expect(runMacros).toHaveBeenCalled();
    expect(runMacros.mock.calls[0][0]).toEqual([{ name: "macro2" }]);
  });
  it("runs macros for passing rules only when only second rule passes", async () => {
    await mockProcessTransaction(
      mockTransaction,
      [
        {
          name: "rule1",
          filters: [{ type: "direction", direction: "in" }],
          macros: [{ name: "macro1" }],
        },
        {
          name: "rule2",
          filters: [{ type: "amount", test: "gt", value: 200 }],
          macros: [{ name: "macro2" }],
        },
      ],
      [
        { func: "direction", value: true },
        { func: "amount", value: false },
      ]
    );
    await Promise.resolve();
    expect(runMacros).toHaveBeenCalled();
    expect(runMacros.mock.calls[0][0]).toEqual([{ name: "macro1" }]);
  });
  it("logs error with id for colour if filter function throws error", async () => {
    evaluatingFunctions.direction.mockImplementation(() => {
      throw new Error("Mock error message");
    });
    await mockProcessTransaction(mockTransaction, [
      {
        name: "rule1",
        filters: [{ type: "direction", direction: "in" }],
        macros: [{ name: "macro1" }],
      },
    ]);
    expect(logger.log).toHaveBeenCalled();
    expect(logger.log.mock.calls[0]).toEqual([
      "Mock error message",
      mockTransaction.id,
    ]);
  });
});
