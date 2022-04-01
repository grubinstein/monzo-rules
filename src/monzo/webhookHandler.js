import * as db from "../db/dbAdapter.js";
import * as colour from "../colourLogger.js";
import { processTransaction } from "../transactions/transactions.js";

export const handleWebhookPost = (() => {
  let inprogressPromise = Promise.resolve();

  return async (req, res) => {
    if (req.body.type != "transaction.created") {
      return;
    }
    await inprogressPromise;
    inprogressPromise = inprogressPromise.then(async () => {
      const transaction = req.body.data;
      const { id } = transaction;
      const transactionExists = await db.transactionExists(transaction);
      if (transactionExists) {
        colour.log(`Repeat: ${transaction.description} ${transaction.id}`, id);
        return res.status(200).send();
      }
      colour.log(`Handling ${transaction.description} ${transaction.id}`, id);
      await db.addTransaction(transaction);
      await processTransaction(transaction);
      res.status(200).send();
    });

    return inprogressPromise;
  };
})();
