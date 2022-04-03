import * as db from "./src/db/dbAdapter.js";

export const devRules = {
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
};

export const addDevRules = async () => {
  const userId = await db.getUserIdByEmail("gabrielrubinstein1@googlemail.com");
  console.log("Adding test rules");
  devRules.UserId = userId;
  await db.addRule(devRules);
};
