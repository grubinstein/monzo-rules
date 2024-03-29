const createProcessTransaction = ({
  evaluatingFunctions,
  runMacros,
  db,
  logger,
}) => {
  const processTransaction = async (transaction) => {
    const user = await db.getUserByAccountId(transaction.account_id);
    const rules = await db.getAllRulesForUser(user.id);
    runRulesForTransaction(rules, transaction, user);
  };

  const runRulesForTransaction = async (rules, transaction, user) => {
    for (const rule of rules) {
      const rulePassed = await runRuleForTransaction(rule, transaction).catch(
        (e) => logger.log(e.message, transaction.id)
      );
      if (!rulePassed) {
        continue;
      }
      logRulePassedForTransaction(rule, transaction);
      await runMacros(rule.macros, transaction, user);
    }
  };

  const logRulePassedForTransaction = (rule, transaction) => {
    logger.log(
      `Rule ${rule.name} PASSED for ${transaction.description}`,
      transaction.id
    );
  };

  const runRuleForTransaction = async (rule, transaction) => {
    const filters = rule.filters;
    const rulePassed = filters.every(evaluateFilterForTransaction(transaction));
    return rulePassed;
  };

  const evaluateFilterForTransaction = (transaction) => (filter) => {
    const evaluate = evaluatingFunctions[filter.type];
    const result = evaluate(filter, transaction);
    return result;
  };

  return processTransaction;
};

export default createProcessTransaction;
