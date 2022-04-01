import chalk from "chalk";

export const log = (message, id) => {
  if (process.env.NODE_ENV == "test") {
    return;
  }
  const colour = idToColour(id);
  console.log(chalk.hex(colour)(message));
};

const idToColour = function (id) {
  const str = id.substring(16);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += ("00" + value.toString(16)).slice(-2);
  }
  return colour;
};
