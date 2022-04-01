import evaluatingFunctions from "./evaluations.js";
import runMacros from "../macros/macro.js";
import * as db from "../db/dbAdapter.js";
import * as colour from "../colourLogger.js";

export const processTransaction = async (transaction) => {
  const rules = await db.getAllRules();
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    await runRuleForTransaction(rule, transaction).catch((e) => console.log(e));
  }
};

const runRuleForTransaction = async (rule, transaction) => {
  const filters = rule.filters;
  const callTypeFilter = filters.find((f) => f.type == "call");
  if (!callTypeFilter) {
    filters.unshift({ type: "call", call: "created" });
  }
  const pass = filters.every(evaluateFilterForTransaction(transaction));
  if (pass) {
    colour.log(
      `Rule ${rule.name} PASSED for ${transaction.description}`,
      transaction.id
    );
    await runMacros(rule.macros, transaction);
  }
};

const evaluateFilterForTransaction = (transaction) => (filter) => {
  const type = filter.type;
  const evaluate = evaluatingFunctions[type];
  return evaluate(filter, transaction);
};
