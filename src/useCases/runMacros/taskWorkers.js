const createWorkers = (monzo) => {
  const balanceWorker = async (variables, task) => {
    const { pot, variable } = task;
    const { user } = variables;
    throwErrorForMissingVars(
      "Balance",
      [pot, variable, user],
      ["pot", "variable", "user"]
    );
    const balance = await monzo.getPotBalance(user, pot);
    variables[variable] = balance;
    return variables;
  };

  const withdrawOrDeposit = async (variables, task) => {
    const { pot, amount, type } = task;
    const { user, transactionId, triggerId, macroName } = variables;
    const taskName = type.charAt(0).toUpperCase() + type.substring(1);
    throwErrorForMissingVars(
      taskName,
      [pot, amount, user, macroName],
      ["pot", "amount", "user", "macro name"]
    );
    const amountValue = isNaN(amount) ? variables[amount] : amount;
    if (!amountValue) {
      throw new Error(`${taskName} amount could not be resolved.`);
    }
    const monzoFunctionName =
      amountValue > 0 && type == "deposit" ? "deposit" : "withdraw";
    const positiveRoundedAmount = Math.ceil(Math.abs(amountValue));
    await monzo[monzoFunctionName](
      user,
      pot,
      positiveRoundedAmount,
      (transactionId || triggerId) + macroName
    );
    return variables;
  };

  const notifyWorker = async (variables, task) => {
    const { title, body, url, imageUrl } = task;
    const { user } = variables;
    throwErrorForMissingVars("Notify", [title, user], ["title", "user"]);
    const resolvedTitle = resolveVariablesAndFormatCurrency(variables, title);
    const resolvedBody = resolveVariablesAndFormatCurrency(variables, body);
    await monzo.notify(user, resolvedTitle, resolvedBody, url, imageUrl);
    return variables;
  };

  const resolveVariablesAndFormatCurrency = (variables, string) => {
    return string
      .split(" ")
      .map((word) => {
        const firstChar = word[0];
        const varName = word.substring(1);
        const resolvedValue = variables[varName];
        if (!["£", "$", "#"].includes(firstChar) || !resolvedValue) {
          return word;
        }
        return firstChar == "#"
          ? resolvedValue
          : firstChar + (resolvedValue / 100).toFixed(2);
      })
      .join(" ");
  };

  const mathWorker = (variables, task) => {
    const { operation, operands, variable } = task;
    throwErrorForMissingVars(
      "Math",
      [operands, operation],
      ["operands", "operation"]
    );
    const operandsValue = operands.map((arg) =>
      isNaN(arg) ? variables[arg] : arg
    );
    if (operandsValue.some((op) => !op)) {
      throw new Error("Math task operand could not be resolved.");
    }
    variables[variable] = doMath(operation, operandsValue);
    return variables;
  };

  const doMath = (operation, operands) => {
    switch (operation) {
      case "add":
        return operands.reduce((sum, el) => sum + el, 0);
      case "subtract":
        return operands[0] - (operands[1] || 0);
      case "multiply":
        return operands.reduce((prod, el) => prod * el, 1);
      case "divide":
        return operands[0] / (operands[1] || 1);
    }
    throw new Error("Math task operation is invalid.");
  };

  const throwErrorForMissingVars = (taskName, vars, varNames) => {
    if (vars.every((v) => !(!v || (Array.isArray(v) && v.length == 0)))) {
      return;
    }
    const missingVars = vars
      .map((variable, i) => ({
        variable,
        varName: varNames[i],
      }))
      .filter(({ variable: v }) => !v || (Array.isArray(v) && v.length == 0))
      .map(({ varName }) => varName)
      .join(" and ");

    throw new Error(`${taskName} task missing ${missingVars}.`);
  };

  return {
    balance: balanceWorker,
    math: mathWorker,
    deposit: withdrawOrDeposit,
    withdraw: withdrawOrDeposit,
    notify: notifyWorker,
  };
};

export default createWorkers;
