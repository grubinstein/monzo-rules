import Transaction from "./models/Transaction.js";
import MacroHasRule from "./models/MacroHasRule.js";
const { Rule, Macro } = MacroHasRule;

export const transactionExists = async (transaction) => {
  const transactionId = transaction.id;
  const result = await Transaction.findOne({ where: { transactionId } });
  return !!result;
};

export const addTransaction = async (transaction) => {
  const { id: transactionId, dedupe_id } = transaction;
  await Transaction.create({
    transactionId,
    dedupe_id,
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
