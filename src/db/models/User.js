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
    monzoUserId: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    monzoAccountId: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelname: "user",
  }
);

export default User;
