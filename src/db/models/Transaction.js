import Sequelize from "sequelize";
import sequelize from "../sequelize.js";

const Model = Sequelize.Model;

class Transaction extends Model {}

Transaction.init(
  {
    transactionId: {
      type: Sequelize.STRING,
    },
    dedupe_id: {
      type: Sequelize.STRING,
    },
    transaction: {
      type: Sequelize.JSON,
    },
  },
  {
    sequelize,
    modelname: "transaction",
  }
);

export default Transaction;
