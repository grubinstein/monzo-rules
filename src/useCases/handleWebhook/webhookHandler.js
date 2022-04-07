const createWebhookHandler = ({ processTransaction, db, logger }) => {
  const getTransactionWithType = (req) => {
    const transaction = req.body.data;
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
    const newRequest = await db.addRequestIfNew(transaction);
    logRequest(newRequest, transaction);
    if (newRequest) {
      await processTransaction(transaction);
    }
    res.status(200).send();
  };

  return handleWebhook;
};

export default createWebhookHandler;
