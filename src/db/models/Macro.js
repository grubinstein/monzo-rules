import Sequelize from "sequelize";
import sequelize from "../sequelize.js";

const Model = Sequelize.Model;

class Macro extends Model {}

Macro.init(
  {
    name: {
      type: Sequelize.STRING,
    },
    tasks: {
      type: Sequelize.JSON,
    },
  },
  {
    sequelize,
    modelname: "macro",
  }
);

export default Macro;
