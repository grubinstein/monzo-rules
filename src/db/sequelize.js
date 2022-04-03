import Sequelize from "sequelize";
import config from "config";

const dbConfig = config.get("database");

const { database, username, password, dialect, storage, logging } = dbConfig;

const sequelize = new Sequelize(database, username, password, {
  dialect,
  storage,
  logging,
  transactionType: "EXCLUSIVE",
  retry: {
    max: 10,
    match: [
      "SQLITE_BUSY",
      "SQLITE_BUSY: database is locked",
      "Error: SQLITE_BUSY: database is locked",
    ],
  },
});

export default sequelize;
