import Models from "./relations.js";
import seq from "sequelize";
import sequelizeInstance from "./sequelize.js";
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

const getUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const getRefreshToken = async (passedUser) => {
  if (!passedUser.id) {
    throw new Error("User does not contain ID");
  }
  const user = await User.findByPk(passedUser.id);
  return user.refreshToken;
};

export const setAccountId = async (user, accountId) => {
  if (!accountId) {
    throw new Error("No account ID provided.");
  }
  await User.update({ monzoAccountId: accountId }, { where: { id: user.id } });
};

export const getUserIdByEmail = async (email) => {
  const user = await getUserByEmail(email);
  return user.id;
};

export const addRequestIfNew = async (transaction) => {
  const { id: transactionId, hash } = transaction;
  const oneSecondAgo = new Date(Date.now() - 1000);
  const newTransactionLength = JSON.stringify(transaction).length;
  const [request, created] = await Request.findOrCreate({
    where: {
      transactionId,
      [seq.Op.or]: [
        { hash },
        {
          [seq.Op.and]: [
            {
              createdAt: {
                [seq.Op.gte]: oneSecondAgo,
              },
            },
            seq.where(seq.fn("LENGTH", seq.col("transaction")), {
              [seq.Op.gt]: newTransactionLength,
            }),
          ],
        },
      ],
    },
    defaults: {
      transactionId,
      hash,
      transaction,
    },
  });
  return [created, request];
};

export const mostRecentRequest = async (transactionId, id) => {
  const request = await Request.findOne({
    where: {
      transactionId,
      id: {
        [seq.Op.gt]: id,
      },
    },
  });
  return !request;
};

export const logProcessingAndPrimality = async (transaction) => {
  const { id: transactionId, hash } = transaction;
  transaction.processingStarted = new Date();
  await sequelizeInstance.transaction(async (t) => {
    const processedRequest = await Request.findOne(
      {
        where: {
          transactionId,
          firstProcessed: true,
        },
      },
      { transaction: t }
    );
    transaction.firstProcessed = !processedRequest;
    await Request.update(
      {
        processingStarted: transaction.processingStarted,
        firstProcessed: transaction.firstProcessed,
      },
      {
        where: {
          transactionId,
          hash,
        },
        transaction: t,
      }
    );
  });
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
