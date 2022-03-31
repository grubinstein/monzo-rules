import {
  getPotBalance,
  withdraw,
  deposit,
  notify,
} from "../monzo/monzoClient.js";

const balanceWorker = async (variables, task) => {
  const { pot, variable } = task;
  const balance = await getPotBalance(pot);
  variables[variable] = balance;
  return variables;
};

const depositWorker = async (variables, task) => {
  const { pot, amount } = task;
  const amountValue = isNaN(amount) ? variables[amount] : amount;
  if (!amountValue) {
    throw new Error("Amount could not be resolved");
  }
  await deposit(
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
  await withdraw(
    pot,
    amountValue,
    variables.transactionId + variables.macroName
  );
  return variables;
};

const notifyWorker = async (variables, task) => {
  const { title, body, url } = task;
  await notify(title, body, url);
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

const workers = {
  balance: balanceWorker,
  math: mathWorker,
  deposit: depositWorker,
  withdraw: withdrawWorker,
  notify: notifyWorker,
};

export default workers;
