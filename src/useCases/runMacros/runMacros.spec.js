import { jest } from "@jest/globals";
import createRunMacros from "./runMacros.js";
import mockTransaction from "../../../test/mockTransaction.js";

mockTransaction.userAccountId = "abc123";

const workers = {
  balance: jest.fn(),
  math: jest.fn(),
  deposit: jest.fn(),
  withdraw: jest.fn(),
  notify: jest.fn(),
};

const logger = { log: jest.fn() };

const runMacros = createRunMacros({ workers, logger });

const mockUser = { accessToken: "abc123", refreshToken: "123abc" };

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  Object.values(workers).forEach((worker) => {
    worker.mockImplementation((variables) => variables);
  });
});

describe("run macros", () => {
  const testRunMacros = (taskTypes, transactionFields) => {
    const transaction = { ...mockTransaction, ...transactionFields };
    const tasks = taskTypes.map((type) => ({ type }));
    const macros = [{ name: "macro1", tasks }];
    return runMacros(macros, transaction, mockUser);
  };

  it("returns undefined if macros is not passed", async () => {
    const result = await runMacros(undefined, mockTransaction);
    expect(result).toBeUndefined();
  });
  it("returns undefined if macros is not passed", async () => {
    const result = await runMacros([], mockTransaction);
    expect(result).toBeUndefined();
  });
  it("doesn't call any workers if no tasks are passed in macro", async () => {
    await testRunMacros([]);
    Object.values(workers).forEach((worker) => {
      expect(worker).not.toHaveBeenCalled();
    });
  });
  it("calls balanceWorker when balance task included", async () => {
    await testRunMacros(["balance"]);
    expect(workers.balance).toHaveBeenCalled();
  });
  it("passes variables to balanceWorker", async () => {
    await testRunMacros(["balance"]);
    const args = workers.balance.mock.calls[0];
    expect(Object.keys(args[0])).toEqual([
      "user",
      "transactionAmount",
      "transactionId",
      "macroName",
    ]);
    expect(args[0].user).toBe(mockUser);
    expect(args[0].transactionAmount).toBe(mockTransaction.amount);
    expect(args[0].transactionId).toBe(mockTransaction.id);
    expect(args[0].macroName).toBe("macro1");
  });
  it("passes task to balanceWorker", async () => {
    await testRunMacros(["balance"]);
    const args = workers.balance.mock.calls[0];
    expect(args[1]).toEqual({ type: "balance" });
  });
  it("performs multiple tasks", async () => {
    const tasks = ["math", "deposit", "withdraw", "notify"];
    await testRunMacros(tasks);
    [("math", "deposit", "withdraw", "notify")].forEach((type) => {
      expect(workers[type]).toHaveBeenCalled();
    });
  });
  it("stores new variables for next task", async () => {
    workers.balance.mockImplementation((variables) => {
      variables.testVariable = "test";
      return variables;
    });
    const tasks = ["balance", "math"];
    await testRunMacros(tasks);
    expect(workers.math.mock.calls[0][0]).toHaveProperty("testVariable");
    expect(workers.math.mock.calls[0][0].testVariable).toBe("test");
  });
  it("logs Completed running task with id when complete", async () => {
    const tasks = ["balance", "math"];
    await testRunMacros(tasks);
    expect(logger.log).toHaveBeenCalled();
    expect(logger.log.mock.calls[0]).toEqual([
      "Completed running tasks for macro1.",
      mockTransaction.id,
    ]);
  });
  it("runs multiple macros", async () => {
    const macros = [
      { name: "macro1", tasks: [{ type: "withdraw" }] },
      { name: "macro2", tasks: [{ type: "notify" }] },
    ];
    await runMacros(macros, mockTransaction);
    expect(workers.withdraw).toHaveBeenCalled();
    expect(workers.notify).toHaveBeenCalled();
  });
  it("logs complete for multiple macros", async () => {
    const macros = [
      { name: "macro1", tasks: [{ type: "withdraw" }] },
      { name: "macro2", tasks: [{ type: "notify" }] },
    ];
    await runMacros(macros, mockTransaction);
    expect(logger.log.mock.calls[0]).toEqual([
      "Completed running tasks for macro1.",
      mockTransaction.id,
    ]);
    expect(logger.log.mock.calls[1]).toEqual([
      "Completed running tasks for macro2.",
      mockTransaction.id,
    ]);
  });
  it("throws no errors when no transaction is paased", async () => {
    const macros = [{ name: "macro1", tasks: [{ type: "withdraw" }] }];
    const runWithoutTransaction = async () => await runMacros(macros);
    expect(runWithoutTransaction).not.toThrowError();
  });
  it("runs macro when no transaction is passed", async () => {
    const macros = [{ name: "macro1", tasks: [{ type: "withdraw" }] }];
    await runMacros(macros);
    expect(workers.withdraw).toHaveBeenCalled();
  });
});
