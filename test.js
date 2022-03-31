import sequelize from "./src/db/sequelize.js";

sequelize.sync({ force: true });
import { addRule } from "./src/db/dbAdapter.js";

addRule({
  name: "Larger than 10p",
  filters: [
    {
      type: "amount",
      test: "gt",
      value: 10,
    },
    {
      type: "direction",
      direction: "in",
    },
  ],
  macros: [
    {
      name: "Macro1",
      tasks: [
        {
          type: "balance",
          pot: "current",
          variable: "currentBalance",
        },
        {
          type: "math",
          operation: "subtract",
          operands: ["currentBalance", "transactionAmount"],
          variable: "toDeposit",
        },
        {
          type: "notify",
          title: "Test notification",
          body: "Test body",
        },
      ],
    },
  ],
});
