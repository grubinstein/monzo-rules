import fs from "fs";
import { getPots } from "../monzo/monzoDriver.js";

export const updatePots = async () => {
  const pots = await getPots();
  const activePots = pots.filter((pot) => pot.deleted == false);
  const activePotsHash = activePots.reduce((pots, pot) => {
    pots[pot.name] = pot;
    return pots;
  }, {});
  fs.writeFileSync("pots.json", JSON.stringify(activePotsHash));
};
