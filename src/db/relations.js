import Request from "./models/Request.js";
import User from "./models/User.js";
import Rule from "./models/Rule.js";
import Macro from "./models/Macro.js";

Rule.Macro = Rule.belongsToMany(Macro, { through: "RuleHasMacro" });
Macro.Rule = Macro.belongsToMany(Rule, { through: "RuleHasMacro" });
Rule.User = Rule.belongsTo(User);
User.Rule = User.hasMany(Rule);

export default { Rule, Macro, User, Request };
