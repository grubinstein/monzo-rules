import Request from "./models/Request.js";

export const transactionExists = async (transaction) => {
  const { id } = transaction;
  const count = await Request.countDocuments({ _id: id });
  return count > 0;
};

export const addTransaction = async (transaction) => {
  const { id: _id, dedupe_id } = transaction;
  await Request.create({
    _id,
    dedupe_id,
    transaction,
  });
};
