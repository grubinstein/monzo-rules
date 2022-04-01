import * as db from "../db/dbAdapter.js";
import * as colour from "../colourLogger.js";

const createWebhookService = (processTransaction) => async (req, res) => {
  const transaction = req.body.data;
  transaction.callType = req.body.type;
  const { id } = transaction;
  const requestExists = await db.requestExists(transaction);
  if (requestExists) {
    colour.log(
      `Repeat: ${transaction.description} ${transaction.id} ${transaction.callType}`,
      id
    );
    return res.status(200).send();
  }
  colour.log(
    `Handling ${transaction.description} ${transaction.id} ${transaction.callType}`,
    id
  );
  await db.addRequest(transaction);
  await processTransaction(transaction);
  res.status(200).send();
};

export default createWebhookService;
