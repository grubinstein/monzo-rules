import Transaction from "./models/Transaction.js";

export const transactionExists = async (transaction) => {
  const transactionId = transaction.id;
  const result = await Transaction.findOne({ where: { transactionId } });
  return !!result;
};

export const addTransaction = async (transaction) => {
  const { id: transactionId, dedupe_id } = transaction;
  await Transaction.create({
    transactionId,
    dedupe_id,
    transaction,
  });
};
