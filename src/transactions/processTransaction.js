const createProcessTransaction = ({
  evaluatingFunctions,
  runMacros,
  db,
  colour,
}) => {
  const processTransaction = async (transaction) => {
    const rules = await db.getAllRules();
    runRulesForTransaction(rules, transaction);
  };

  const runRulesForTransaction = async (rules, transaction) => {
    for (const rule of rules) {
      const rulePassed = await runRuleForTransaction(rule, transaction).catch(
        console.log
      );
      if (!rulePassed) {
        return;
      }
      logRulePassedForTransaction(rule, transaction);
      await runMacros(rule.macros, transaction);
    }
  };

  const logRulePassedForTransaction = (rule, transaction) => {
    colour.log(
      `Rule ${rule.name} PASSED for ${transaction.description}`,
      transaction.id
    );
  };

  const runRuleForTransaction = async (rule, transaction) => {
    const filters = rule.filters;
    addCallTypeTransactionFilterIfNone(filters);
    const rulePassed = filters.every(evaluateFilterForTransaction(transaction));
    return rulePassed;
  };

  const evaluateFilterForTransaction = (transaction) => (filter) => {
    const evaluate = evaluatingFunctions[filter.type];
    const result = evaluate(filter, transaction);
    return result;
  };

  const addCallTypeTransactionFilterIfNone = (filters) => {
    const callTypeFilter = filters.find((f) => f.type == "call");
    if (!callTypeFilter) {
      filters.unshift({ type: "call", call: "created" });
    }
  };

  return processTransaction;
};

export default createProcessTransaction;