import Rule from "./Rule.js";
import Macro from "./Macro.js";

Rule.belongsToMany(Macro, { through: "RuleHasMacro" });
Macro.belongsToMany(Rule, { through: "RuleHasMacro" });

export default { Rule, Macro };
