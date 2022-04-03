import Sequelize from "sequelize";
import sequelize from "../sequelize.js";

const Model = Sequelize.Model;

class User extends Model {}

User.init(
  {
    email: {
      type: Sequelize.STRING,
    },
    accessToken: {
      type: Sequelize.STRING,
    },
    refreshToken: {
      type: Sequelize.STRING,
    },
    userId: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    accountId: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelname: "user",
  }
);

export default User;
