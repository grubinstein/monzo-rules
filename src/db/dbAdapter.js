import Models from "./relations.js";
import sequelize from "sequelize";
const { Rule, Macro, User, Request } = Models;

export const storeUserAccessData = async ({
  access_token: accessToken,
  refresh_token: refreshToken,
  user_id: userId,
}) => {
  const email = "gabrielrubinstein1@googlemail.com";
  const user = await User.findOne({ where: { email } });
  if (!user) {
    await User.create({
      email,
      accessToken,
      refreshToken,
      userId,
    });
    return;
  }
  await user.update({ accessToken, refreshToken });
  return user;
};

export const getUserByAccountId = async (accountId) => {
  const user = await User.findOne({ where: { monzoAccountId: accountId } });
  return user;
};

export const getUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const getRefreshToken = async (passedUser) => {
  const user = await User.findByPk(passedUser.id);
  return user.refreshToken;
};

export const setAccountId = async (user, accountId) => {
  await User.update({ monzoAccountId: accountId }, { where: { id: user.id } });
};

export const getUserIdByEmail = async (email) => {
  const user = await getUserByEmail(email);
  return user.id;
};

export const requestExists = async (transaction) => {
  const { id: transactionId, callType } = transaction;
  const result = await Request.findOne({
    where: { transactionId, callType },
  });
  return !!result;
};

export const addRequest = async (transaction) => {
  const { id: transactionId, dedupe_id, callType } = transaction;
  await Request.create({
    transactionId,
    dedupe_id,
    callType,
    transaction,
  });
};

export const addRequestIfNew = async (transaction) => {
  const { id: transactionId, hash, callType } = transaction;
  const [request, created] = await Request.findOrCreate({
    where: {
      transactionId,
      [sequelize.Op.or]: [
        { hash },
        {
          [sequelize.Op.and]: [
            sequelize.where(sequelize.fn("date", sequelize.col("createdAt")), {
              [sequelize.Op.gte]: new Date(Date.now() - 1000),
            }),
            sequelize.where(
              sequelize.fn("LENGTH", sequelize.col("transaction")),
              { [sequelize.Op.gt]: JSON.stringify(transaction).length }
            ),
          ],
        },
      ],
    },
    defaults: {
      transactionId,
      hash,
      callType,
      transaction,
    },
  });
  return created && request.id;
};

export const mostRecentRequest = async (transactionId, id) => {
  const request = await Request.findOne({
    where: {
      transactionId,
      id: {
        [sequelize.Op.gt]: id,
      },
    },
  });
  return !request;
};

export const addRule = async (ruleObject) => {
  const { name, filters, UserId, macros } = ruleObject;
  const rule = await Rule.create({ name, filters, UserId });
  if (macros && macros.length) {
    for (let i = 0; i < macros.length; i++) {
      let macro = macros[i];
      if (typeof macro === "string") {
        macro = await Macro.findByPk(macro);
      } else if (!(macro instanceof Macro)) {
        macro = await Macro.create(macro);
      }
      await rule.addMacro(macro);
    }
  }
};

export const getAllRules = async () => {
  const rules = await Rule.findAll({ include: Macro });
  return rules.map((rule) => {
    rule.macros = rule.Macros;
    return rule;
  });
};
