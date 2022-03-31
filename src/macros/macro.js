import workers from "./workers.js";

const runMacro = async (rule, transaction) => {
  if (!rule.tasks || !rule.tasks.length) {
    return;
  }
  const tasks = [...rule.tasks];
  const variables = {
    transactionAmount: transaction.amount,
    transactionId: transaction.id,
    ruleName: rule.name,
  };
  await performNextTask(variables, tasks);
};

const performNextTask = async (variables, tasks) => {
  const task = tasks.shift();
  const worker = workers[task.type];
  const newVariables = await worker(variables, task);
  if (tasks.length) {
    await performNextTask(newVariables, tasks);
  } else {
    console.log("Completed running tasks.");
  }
};

export default runMacro;
