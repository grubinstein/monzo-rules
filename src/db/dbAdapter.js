import Request from "./models/Request.js";
import MacroHasRule from "./models/MacroHasRule.js";
const { Rule, Macro } = MacroHasRule;

export const requestExists = async (transaction) => {
  const { id: transactionId, callType } = transaction;
  const result = await Request.findOne({
    where: { transactionId, callType },
  });
  return !!result;
};

export const addRequest = async (transaction) => {
  const { id: transactionId, dedupe_id, callType } = transaction;
  await Request.create({
    transactionId,
    dedupe_id,
    callType,
    transaction,
  });
};

export const addRule = async (ruleObject) => {
  const { name, filters, macros } = ruleObject;
  const rule = await Rule.create({ name, filters });
  if (macros && macros.length) {
    for (let i = 0; i < macros.length; i++) {
      let macro = macros[i];
      if (typeof macro === "string") {
        macro = await Macro.findByPk(macro);
      } else if (!(macro instanceof Macro)) {
        macro = await Macro.create(macro);
      }
      await rule.addMacro(macro);
    }
  }
};

export const getAllRules = async () => {
  const rules = await Rule.findAll({ include: Macro });
  return rules.map((rule) => {
    rule.macros = rule.Macros;
    return rule;
  });
};
