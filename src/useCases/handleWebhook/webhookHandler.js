const createWebhookHandler = ({ hash, processTransaction, db, logger }) => {
  const getTransactionWithType = (req) => {
    const transaction = req.body.data;
    transaction.hash = hash.MD5(transaction);
    return transaction;
  };

  const logRequest = (newRequest, transaction) => {
    const { description, id } = transaction;
    logger.log(
      `${newRequest ? "Handling" : "Repeat"}: ${description} ${id}`,
      id
    );
  };

  const handleWebhook = async (req, res) => {
    const transaction = getTransactionWithType(req);
    const [created, request] = await db.addRequestIfNew(transaction);
    if (created) {
      await wait(1000);
    }
    const newRequest =
      created && (await db.mostRecentRequest(transaction.id, request));
    logRequest(newRequest, transaction);
    if (newRequest) {
      await processTransaction(transaction);
    }
    res.status(200).send();
  };

  const wait = async (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  return handleWebhook;
};

export default createWebhookHandler;
