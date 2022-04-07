import { jest } from "@jest/globals";
import createWorkers from "./taskWorkers.js";
import mockTransaction from "../../../test/mockTransaction.js";

const monzo = {
  getPotBalance: jest.fn(),
  deposit: jest.fn(),
  withdraw: jest.fn(),
  notify: jest.fn(),
};

const workers = createWorkers(monzo);

const mockVariables = {
  accountId: "abc123",
  transactionAmount: mockTransaction.amount,
  transactionId: mockTransaction.id,
  macroName: "macro1",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe("balance worker", () => {
  const runBalanceTask = async (
    pot = "Savings",
    variable = "balVar",
    variableDelta,
    testError
  ) => {
    const variables = { ...mockVariables, ...variableDelta };
    const task = { pot, variable };
    const result = await workers.balance(variables, task).catch((e) => {
      if (testError) {
        throw e;
      }
      return e.message;
    });
    return result;
  };
  const runBalanceTaskWithErrors = (...args) =>
    runBalanceTask(args[0], args[1], args[2], true);
  it("returns all passed variables", async () => {
    const result = await runBalanceTask();
    expect(result).toEqual(expect.objectContaining(mockVariables));
  });
  it("calls monzo.getPotBalance", async () => {
    await runBalanceTask();
    expect(monzo.getPotBalance).toHaveBeenCalled();
  });
  it("it calls getPotBalance with accountId from variables and pot name", async () => {
    await runBalanceTask();
    expect(monzo.getPotBalance.mock.calls[0]).toEqual([
      mockVariables.accountId,
      "Savings",
    ]);
  });
  it("adds balance to variables as specified property", async () => {
    monzo.getPotBalance.mockImplementation(() => {
      return 1200;
    });
    const result = await runBalanceTask();
    expect(result.balVar).toBe(1200);
  });
  it("throws error if no pot name is passed", async () => {
    const runWithoutPotName = () => runBalanceTaskWithErrors("");
    await expect(runWithoutPotName).rejects.toThrow(
      "Balance task missing pot."
    );
  });
  it("throws error if no variable name is passed", async () => {
    const runWithoutVarName = () => runBalanceTaskWithErrors("Savings", "");
    await expect(runWithoutVarName).rejects.toThrow(
      "Balance task missing variable."
    );
  });
  it("throws error if no accountId provided in variables", async () => {
    const runWithoutUser = () =>
      runBalanceTaskWithErrors("Savings", "balVar", { accountId: undefined });
    await expect(runWithoutUser).rejects.toThrow(
      "Balance task missing user account ID."
    );
  });
  it("throws error if two variables missing", async () => {
    const runWithoutUser = () =>
      runBalanceTaskWithErrors("", "balVar", { accountId: undefined });
    await expect(runWithoutUser).rejects.toThrow(
      "Balance task missing pot and user account ID."
    );
  });
  it("doesn't throw error if no transaction details passed", async () => {
    const variableDelta = {
      transactionId: undefined,
      transactionAmount: undefined,
    };
    const runWithoutTransaction = () =>
      runBalanceTaskWithErrors(undefined, undefined, variableDelta);
    await expect(runWithoutTransaction).not.toThrowError();
  });
});

describe("deposit worker", () => {
  const runDepositTask = async (
    pot = "Savings",
    amount = 150,
    variableDelta,
    testError
  ) => {
    const variables = { ...mockVariables, ...variableDelta };
    const task = { type: "deposit", pot, amount };
    const result = await workers.deposit(variables, task).catch((e) => {
      if (testError) {
        throw e;
      }
      return e.message;
    });
    return result;
  };
  const runDepositTaskWithErrors = (...args) =>
    runDepositTask(args[0], args[1], args[2], true);
  it("returns all passed variables", async () => {
    const result = await runDepositTask();
    expect(result).toEqual(expect.objectContaining(mockVariables));
  });
  it("calls monzo.deposit", async () => {
    await runDepositTask();
    expect(monzo.deposit).toHaveBeenCalled();
  });
  it("calls monzo.deposit with accountId, pot, and amount", async () => {
    await runDepositTask();
    expect(monzo.deposit.mock.calls[0]).toEqual(
      expect.arrayContaining([mockVariables.accountId, "Savings", 150])
    );
  });
  it("provides dedupe_id to monzo.deposit", async () => {
    await runDepositTask();
    expect(monzo.deposit.mock.calls[0][3]).toBe(mockTransaction.id + "macro1");
  });
  it("uses triggerId for dedupe_id if transactionId not passed", async () => {
    await runDepositTask(undefined, undefined, {
      transactionId: undefined,
      triggerId: 1234,
    });
    expect(monzo.deposit.mock.calls[0][3]).toBe("1234macro1");
  });
  it("resolves string to amount from variables", async () => {
    await runDepositTask(undefined, "testVar", { testVar: 200 });
    expect(monzo.deposit.mock.calls[0][2]).toBe(200);
  });
  it("throws error if deposit amount is string and not passed in variables", async () => {
    const runWithBadAmountName = () =>
      runDepositTaskWithErrors(undefined, "testVar");
    await expect(runWithBadAmountName).rejects.toThrow(
      "Deposit amount could not be resolved."
    );
  });
  it("throws error if no pot name is passed", async () => {
    const runWithoutPotName = () => runDepositTaskWithErrors("");
    await expect(runWithoutPotName).rejects.toThrow(
      "Deposit task missing pot."
    );
  });
  it("throws error if no variable name is passed", async () => {
    const runWithoutVarName = () => runDepositTaskWithErrors("Savings", "");
    await expect(runWithoutVarName).rejects.toThrow(
      "Deposit task missing amount."
    );
  });
  it("throws error if no accountId provided in variables", async () => {
    const runWithoutUser = () =>
      runDepositTaskWithErrors("Savings", 150, { accountId: undefined });
    await expect(runWithoutUser).rejects.toThrow(
      "Deposit task missing user account ID."
    );
  });
  it("doesn't throw error if no transaction details passed", async () => {
    const variableDelta = {
      transactionId: undefined,
      transactionAmount: undefined,
    };
    const runWithoutTransaction = () =>
      runDepositTaskWithErrors(undefined, undefined, variableDelta);
    await expect(runWithoutTransaction).not.toThrowError();
  });
  it("throws an error when macroName is not present in variables", async () => {
    const runWithoutMacroName = () =>
      runDepositTaskWithErrors(undefined, undefined, { macroName: undefined });
    await expect(runWithoutMacroName).rejects.toThrow(
      "Deposit task missing macro name."
    );
  });
  it("rounds up to nearest penny before sending to monzo", async () => {
    await runDepositTask("Savings", 123.33333333);
    expect(monzo.deposit.mock.calls[0][2]).toBe(124);
  });
});

describe("withdraw worker", () => {
  const runWithdrawTask = async (
    pot = "Savings",
    amount = 150,
    variableDelta,
    testError
  ) => {
    const variables = { ...mockVariables, ...variableDelta };
    const task = { type: "withdraw", pot, amount };
    const result = await workers.withdraw(variables, task).catch((e) => {
      if (testError) {
        throw e;
      }
      return e.message;
    });
    return result;
  };
  const runWithdrawTaskWithErrors = (...args) =>
    runWithdrawTask(args[0], args[1], args[2], true);
  it("returns all passed variables", async () => {
    const result = await runWithdrawTask();
    expect(result).toEqual(expect.objectContaining(mockVariables));
  });
  it("calls monzo.withdraw", async () => {
    await runWithdrawTask();
    expect(monzo.withdraw).toHaveBeenCalled();
  });
  it("calls monzo.withdraw with accountId, pot, and amount", async () => {
    await runWithdrawTask();
    expect(monzo.withdraw.mock.calls[0]).toEqual(
      expect.arrayContaining([mockVariables.accountId, "Savings", 150])
    );
  });
  it("provides dedupe_id to monzo.withdraw", async () => {
    await runWithdrawTask();
    expect(monzo.withdraw.mock.calls[0][3]).toBe(mockTransaction.id + "macro1");
  });
  it("uses triggerId for dedupe_id if transactionId not passed", async () => {
    await runWithdrawTask(undefined, undefined, {
      transactionId: undefined,
      triggerId: 1234,
    });
    expect(monzo.withdraw.mock.calls[0][3]).toBe("1234macro1");
  });
  it("resolves string to amount from variables", async () => {
    await runWithdrawTask(undefined, "testVar", { testVar: 200 });
    expect(monzo.withdraw.mock.calls[0][2]).toBe(200);
  });
  it("throws error if withdraw amount is string and not passed in variables", async () => {
    const runWithBadAmountName = () =>
      runWithdrawTaskWithErrors(undefined, "testVar");
    await expect(runWithBadAmountName).rejects.toThrow(
      "Withdraw amount could not be resolved."
    );
  });
  it("throws error if no pot name is passed", async () => {
    const runWithoutPotName = () => runWithdrawTaskWithErrors("");
    await expect(runWithoutPotName).rejects.toThrow(
      "Withdraw task missing pot."
    );
  });
  it("throws error if no variable name is passed", async () => {
    const runWithoutVarName = () => runWithdrawTaskWithErrors("Savings", "");
    await expect(runWithoutVarName).rejects.toThrow(
      "Withdraw task missing amount."
    );
  });
  it("throws error if no accountId provided in variables", async () => {
    const runWithoutUser = () =>
      runWithdrawTaskWithErrors("Savings", 150, { accountId: undefined });
    await expect(runWithoutUser).rejects.toThrow(
      "Withdraw task missing user account ID."
    );
  });
  it("doesn't throw error if no transaction details passed", async () => {
    const variableDelta = {
      transactionId: undefined,
      transactionAmount: undefined,
    };
    const runWithoutTransaction = () =>
      runWithdrawTaskWithErrors(undefined, undefined, variableDelta);
    await expect(runWithoutTransaction).not.toThrowError();
  });
  it("throws an error when macroName is not present in variables", async () => {
    const runWithoutMacroName = () =>
      runWithdrawTaskWithErrors(undefined, undefined, { macroName: undefined });
    await expect(runWithoutMacroName).rejects.toThrow(
      "Withdraw task missing macro name."
    );
  });
  it("rounds up to nearest penny before sending to monzo", async () => {
    await runWithdrawTask("Savings", 123.33333333);
    expect(monzo.withdraw.mock.calls[0][2]).toBe(124);
  });
});

describe("Notify worker", () => {
  const runNotifyTask = async (
    title = "Test title",
    body = "Test body",
    url = "www.test.com",
    imageUrl = "www.image.com",
    variableDelta,
    testError
  ) => {
    const variables = { ...mockVariables, ...variableDelta };
    const task = { title, body, url, imageUrl };
    const result = await workers.notify(variables, task).catch((e) => {
      if (testError) {
        throw e;
      }
      return e.message;
    });
    return result;
  };
  const runNotifyTaskWithErrors = (...args) =>
    runNotifyTask(args[0], args[1], args[2], args[3], args[4], true);
  it("returns all passed variables", async () => {
    const result = await runNotifyTask();
    expect(result).toEqual(expect.objectContaining(mockVariables));
  });
  it("calls monzo.notify", async () => {
    await runNotifyTask();
    expect(monzo.notify).toHaveBeenCalled();
  });
  it("calls monzo.withdraw with accountId, title, body, url, image_url", async () => {
    await runNotifyTask();
    expect(monzo.notify.mock.calls[0]).toEqual(
      expect.arrayContaining([
        mockVariables.accountId,
        "Test title",
        "Test body",
        "www.test.com",
        "www.image.com",
      ])
    );
  });
  it("throws error if no title is passed", async () => {
    const runWithoutTitle = () => runNotifyTaskWithErrors("");
    await expect(runWithoutTitle).rejects.toThrow("Notify task missing title.");
  });
  it("throws error if no accountId is passed", async () => {
    const runWithoutUser = () =>
      runNotifyTaskWithErrors(undefined, undefined, undefined, undefined, {
        accountId: undefined,
      });
    await expect(runWithoutUser).rejects.toThrow(
      "Notify task missing user account ID."
    );
  });
  it("resolves title words beginning with # to values from variables", async () => {
    await runNotifyTask(
      "Title #word #number variables",
      undefined,
      undefined,
      undefined,
      { word: "with", number: "2" }
    );
    expect(monzo.notify.mock.calls[0][1]).toBe("Title with 2 variables");
  });
  it("resolves body words beginning with # to values from variables", async () => {
    await runNotifyTask(
      undefined,
      "Body #word #number variables",
      undefined,
      undefined,
      { word: "with", number: "2" }
    );
    expect(monzo.notify.mock.calls[0][2]).toBe("Body with 2 variables");
  });
  it("resolves title words beginning with £ with variables and formats for currency", async () => {
    await runNotifyTask(
      "You have £remaining left",
      undefined,
      undefined,
      undefined,
      { remaining: 2534 }
    );
    expect(monzo.notify.mock.calls[0][1]).toBe("You have £25.34 left");
  });
  it("resolves title words beginning with $ with variables and formats for currency", async () => {
    await runNotifyTask(
      "You have $remaining left",
      undefined,
      undefined,
      undefined,
      { remaining: 2534 }
    );
    expect(monzo.notify.mock.calls[0][1]).toBe("You have $25.34 left");
  });
  it("resolves body words beginning with $ and £ correctly", async () => {
    await runNotifyTask(
      undefined,
      "You have $dollars and £pounds left",
      undefined,
      undefined,
      { dollars: 12354, pounds: 94 }
    );
    expect(monzo.notify.mock.calls[0][2]).toBe(
      "You have $123.54 and £0.94 left"
    );
  });
  it("returns original text where variable resolution fails", async () => {
    await runNotifyTask(
      "Title with #good and #bad vars",
      "Body with £goodNum and $badNum",
      undefined,
      undefined,
      { good: "GREAT", goodNum: 1234 }
    );
    expect(monzo.notify.mock.calls[0][1]).toBe(
      "Title with GREAT and #bad vars"
    );
    expect(monzo.notify.mock.calls[0][2]).toBe("Body with £12.34 and $badNum");
  });
  it("doesn't throw error if no transaction details passed", async () => {
    const variableDelta = {
      transactionId: undefined,
      transactionAmount: undefined,
    };
    const runWithoutTransaction = () =>
      runNotifyTaskWithErrors(
        undefined,
        undefined,
        undefined,
        undefined,
        variableDelta
      );
    await expect(runWithoutTransaction).not.toThrowError();
  });
});

describe("math worker", () => {
  const runMathTask = (
    firstOperand = 1,
    operation = "add",
    secondOperand = 1,
    variable = "mathVar",
    variableDelta
  ) => {
    const variables = { ...mockVariables, ...variableDelta };
    const task = {
      operation,
      operands: [firstOperand, secondOperand],
      variable,
    };
    const result = workers.math(variables, task);
    return result;
  };
  it("returns all passed variables", async () => {
    const result = runMathTask();
    expect(result).toEqual(expect.objectContaining(mockVariables));
  });
  it("adds two numbers and puts result in specified variable", () => {
    const result = runMathTask(12, "add", 13);
    expect(result.mathVar).toBe(25);
  });
  it("adds negative numbers correctly", () => {
    const result1 = runMathTask(-12, "add", 13);
    const result2 = runMathTask(12, "add", -13);
    const result3 = runMathTask(-12, "add", -13);
    expect(result1.mathVar).toBe(1);
    expect(result2.mathVar).toBe(-1);
    expect(result3.mathVar).toBe(-25);
  });
  it("adds more than two numbers", () => {
    const task = {
      operation: "add",
      operands: [-1, 13, 2.5, 100],
      variable: "mathVar",
    };
    const result = workers.math(mockVariables, task);
    expect(result.mathVar).toBe(114.5);
  });
  it("subtracts two numbers", () => {
    const result1 = runMathTask(-12, "subtract", 13);
    const result2 = runMathTask(12, "subtract", -13);
    const result3 = runMathTask(-12, "subtract", -13);
    const result4 = runMathTask(12, "subtract", 13);
    expect(result1.mathVar).toBe(-25);
    expect(result2.mathVar).toBe(25);
    expect(result3.mathVar).toBe(1);
    expect(result4.mathVar).toBe(-1);
  });
  it("multiplies two numbers", () => {
    const result1 = runMathTask(2, "multiply", 13);
    const result2 = runMathTask(2, "multiply", -13);
    const result3 = runMathTask(-2, "multiply", -13);
    const result4 = runMathTask(-12.5, "multiply", -4);
    expect(result1.mathVar).toBe(26);
    expect(result2.mathVar).toBe(-26);
    expect(result3.mathVar).toBe(26);
    expect(result4.mathVar).toBe(50);
  });
  it("multiplies more than two numbers", () => {
    const task = {
      operation: "multiply",
      operands: [-1, 13, 2.5, 100],
      variable: "mathVar",
    };
    const result = workers.math(mockVariables, task);
    expect(result.mathVar).toBe(-3250);
  });
  it("divides two numbers", () => {
    const result1 = runMathTask(6, "divide", 2);
    const result2 = runMathTask(-12, "divide", 4);
    const result3 = runMathTask(50, "divide", -4);
    const result4 = runMathTask(-20.4, "divide", -5.1);
    expect(result1.mathVar).toBe(3);
    expect(result2.mathVar).toBe(-3);
    expect(result3.mathVar).toBe(-12.5);
    expect(result4.mathVar).toBe(4);
  });
  it("adds nothing if only one operand supplied", () => {
    const task = {
      operation: "add",
      operands: [1],
      variable: "mathVar",
    };
    const result = workers.math(mockVariables, task);
    expect(result.mathVar).toBe(1);
  });
  it("subtracts nothing if only one operand supplied", () => {
    const task = {
      operation: "subtract",
      operands: [1],
      variable: "mathVar",
    };
    const result = workers.math(mockVariables, task);
    expect(result.mathVar).toBe(1);
  });
  it("divides by 1 if only one operand supplied", () => {
    const task = {
      operation: "divide",
      operands: [10],
      variable: "mathVar",
    };
    const result = workers.math(mockVariables, task);
    expect(result.mathVar).toBe(10);
  });
  it("multiplies by 1 if only one operand supplied", () => {
    const task = {
      operation: "multiply",
      operands: [10],
      variable: "mathVar",
    };
    const result = workers.math(mockVariables, task);
    expect(result.mathVar).toBe(10);
  });
  it("throws an error if no operands are supplied", () => {
    const task = {
      operation: "multiply",
      operands: undefined,
      variable: "mathVar",
    };
    const runWithoutOperand = () => workers.math(mockVariables, task);
    expect(runWithoutOperand).toThrow("Math task missing operands.");
  });
  it("throws an error when empty operands are supplied", () => {
    const task = {
      operation: "multiply",
      operands: [],
      variable: "mathVar",
    };
    const runWithEmptyOperands = () => workers.math(mockVariables, task);
    expect(runWithEmptyOperands).toThrow("Math task missing operands.");
  });
  it("throws an error when no operation is supplied", () => {
    const task = {
      operation: undefined,
      operands: [2, 3],
      variable: "mathVar",
    };
    const runWithOutOperation = () => workers.math(mockVariables, task);
    expect(runWithOutOperation).toThrow("Math task missing operation.");
  });
  it("throws an error if invalid operation is supplied", () => {
    const runWithInvalidOperation = () => runMathTask(2, "notanop", 3);
    expect(runWithInvalidOperation).toThrow("Math task operation is invalid.");
  });
  it("performs operations using variables", () => {
    const result = runMathTask("firstop", "add", "secondop", undefined, {
      firstop: 3,
      secondop: 5,
    });
    expect(result.mathVar).toBe(8);
  });
  it("throws error if variable operands are not found", () => {
    const runWithInvalidOperands = () =>
      runMathTask("firstop", "add", "secondop", undefined, {
        firstop: 3,
      });
    expect(runWithInvalidOperands).toThrow(
      "Math task operand could not be resolved."
    );
  });
  it("overwrites existing value if variable exists", () => {
    const result = runMathTask("sum", "add", 10, "sum", { sum: 10 });
    expect(result.sum).toBe(20);
  });
});
