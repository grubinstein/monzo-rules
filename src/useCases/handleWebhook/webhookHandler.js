const createWebhookHandler = ({ hash, processTransaction, db, logger }) => {
  const getTransactionWithType = (req) => {
    const transaction = req.body.data;
    transaction.hash = hash.MD5(transaction);
    transaction.callType = req.body.type;
    return transaction;
  };

  const logRequest = (newRequest, transaction) => {
    const { description, id, callType } = transaction;
    logger.log(
      `${newRequest ? "Handling" : "Repeat"}: ${description} ${id} ${callType}`,
      id
    );
  };

  const handleWebhook = async (req, res) => {
    const transaction = getTransactionWithType(req);
    const createdRequestId = await db.addRequestIfNew(transaction);
    if (createdRequestId) {
      await wait(1000);
    }
    const newRequest =
      createdRequestId &&
      (await db.mostRecentRequest(transaction.id, createdRequestId));
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
