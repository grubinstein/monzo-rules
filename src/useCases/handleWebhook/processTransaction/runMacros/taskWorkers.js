const createWorkers = (monzo) => {
  const balanceWorker = async (variables, task) => {
    const { pot, variable } = task;
    const balance = await monzo.getPotBalance(variables.user, pot);
    variables[variable] = balance;
    return variables;
  };

  const depositWorker = async (variables, task) => {
    const { pot, amount } = task;
    const amountValue = isNaN(amount) ? variables[amount] : amount;
    if (!amountValue) {
      throw new Error("Amount could not be resolved");
    }
    await monzo.deposit(
      variables.user,
      pot,
      amountValue,
      variables.transactionId + variables.macroName
    );
    return variables;
  };

  const withdrawWorker = async (variables, task) => {
    const { pot, amount } = task;
    const amountValue = isNaN(amount) ? variables[amount] : amount;
    if (!amountValue) {
      throw new Error("Amount could not be resolved");
    }
    await monzo.withdraw(
      variables.user,
      pot,
      amountValue,
      variables.transactionId + variables.macroName
    );
    return variables;
  };

  const notifyWorker = async (variables, task) => {
    const { title, body, url } = task;
    await monzo.notify(variables.user, title, body, url);
    return variables;
  };

  const mathWorker = (variables, task) => {
    const { operation, operands, variable } = task;
    const operandsValue = operands.map((arg) =>
      isNaN(arg) ? variables[arg] : arg
    );
    variables[variable] = doMath(operation, operandsValue);
    return variables;
  };

  const doMath = (operation, operands) => {
    switch (operation) {
      case "add":
        return operands.reduce((sum, el) => sum + el, 0);
      case "subtract":
        return operands[0] - operands[1];
      case "multiply":
        return operands.reduce((prod, el) => prod * el, 1);
      case "divide":
        return Math.round(operands[0] / operands[1]);
    }
  };

  return {
    balance: balanceWorker,
    math: mathWorker,
    deposit: depositWorker,
    withdraw: withdrawWorker,
    notify: notifyWorker,
  };
};

export default createWorkers;
