const createRunMacros = ({ workers, logger }) => {
  const runMacros = async (macros, transaction, user) => {
    if (!macros || !macros.length) {
      return;
    }
    for (let i = 0; i < macros.length; i++) {
      const macro = macros[i];
      await runMacro(macro, transaction, user);
    }
  };

  const runMacro = async (macro, transaction, user) => {
    if (!macro.tasks || !macro.tasks.length) {
      return;
    }
    const tasks = [...macro.tasks];
    const variables = {
      user,
      transactionAmount: transaction ? transaction.amount : undefined,
      transactionId: transaction ? transaction.id : undefined,
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
      logger.log(
        `Completed running tasks for ${variables.macroName}.`,
        variables.transactionId
      );
    }
  };

  return runMacros;
};

export default createRunMacros;
