import Sequelize from "sequelize";
import sequelize from "../sequelize.js";

const Model = Sequelize.Model;

class Request extends Model {}

Request.init(
  {
    transactionId: {
      type: Sequelize.STRING,
    },
    transaction: {
      type: Sequelize.JSON,
    },
    hash: {
      type: Sequelize.STRING,
    },
    processingStarted: {
      type: Sequelize.DATE,
    },
    firstProcessed: {
      type: Sequelize.BOOLEAN,
    },
  },
  {
    sequelize,
    modelname: "request",
  }
);

export default Request;
