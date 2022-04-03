const createRunMacros = (workers, colour) => {
  const runMacros = async (macros, transaction) => {
    if (!macros || !macros.length) {
      return;
    }
    for (let i = 0; i < macros.length; i++) {
      const macro = macros[i];
      await runMacro(macro, transaction);
    }
  };

  const runMacro = async (macro, transaction) => {
    if (!macro.tasks || !macro.tasks.length) {
      return;
    }
    const tasks = [...macro.tasks];
    const variables = {
      user: transaction.user,
      transactionAmount: transaction.amount,
      transactionId: transaction.id,
      macroName: macro.name,
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
      colour.log("Completed running tasks.", variables.transactionId);
    }
  };

  return runMacros;
};

export default createRunMacros;
