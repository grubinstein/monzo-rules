import Sequelize from "sequelize";
import sequelize from "../sequelize.js";

const Model = Sequelize.Model;

class Rule extends Model {}

Rule.init(
  {
    name: {
      type: Sequelize.STRING,
    },
    filters: {
      type: Sequelize.JSON,
    },
  },
  {
    sequelize,
    modelname: "rule",
  }
);

export default Rule;
