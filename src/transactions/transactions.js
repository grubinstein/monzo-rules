import evaluatingFunctions from "./evaluations.js";
import runMacro from "../macros/macro.js";
import fs from "fs";

export const processTransaction = async (transaction) => {
  const rules = JSON.parse(fs.readFileSync("rules.json"));
  const transactionRules = rules.transaction;
  for (let i = 0; i < transactionRules.length; i++) {
    const rule = transactionRules[i];
    await runRuleForTransaction(rule, transaction).catch((e) => console.log(e));
  }
};

const runRuleForTransaction = async (rule, transaction) => {
  const filters = rule.filters;
  const pass = filters.every(evaluateFilterForTransaction(transaction));
  if (pass) {
    console.log(
      "\x1b[32m%s\x1b[0m",
      `Rule ${rule.name} PASSED for ${transaction.description}`
    );
    await runMacro(rule, transaction);
  }
};

const evaluateFilterForTransaction = (transaction) => (filter) => {
  const type = filter.type;
  const evaluate = evaluatingFunctions[type];
  return evaluate(filter, transaction);
};
