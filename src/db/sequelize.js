import Sequelize from "sequelize";
import config from "config";

const dbConfig = config.get("database");

const { database, username, password, dialect, storage, logging } = dbConfig;

const sequelize = new Sequelize(database, username, password, {
  dialect,
  storage,
  logging,
});

export default sequelize;
