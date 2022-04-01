import Sequelize from "sequelize";
import sequelize from "../sequelize.js";

const Model = Sequelize.Model;

class Request extends Model {}

Request.init(
  {
    transactionId: {
      type: Sequelize.STRING,
    },
    dedupe_id: {
      type: Sequelize.STRING,
    },
    callType: {
      type: Sequelize.STRING,
    },
    transaction: {
      type: Sequelize.JSON,
    },
  },
  {
    sequelize,
    modelname: "request",
  }
);

export default Request;
