const createWebhookHandler = ({ processTransaction, db, colour }) => {
  const storeRequest = async (transaction) => {
    const created = await db.addRequestIfNew(transaction);
    return created;
  };

  const handleTransaction = async (transaction) => {
    transaction.user = await db.getUserByAccountId(transaction.account_id);
    await processTransaction(transaction);
  };

  const getTransactionWithType = (req) => {
    const transaction = req.body.data;
    transaction.callType = req.body.type;
    return transaction;
  };

  const logRequest = (newRequest, transaction) => {
    const { description, id, callType, dedupe_id } = transaction;
    colour.log(
      `${newRequest ? "Handling" : "Repeat"}: ${description} ${id} ${callType}`,
      id
    );
  };

  const handleWebhook = async (req, res) => {
    const transaction = getTransactionWithType(req);
    const newRequest = await storeRequest(transaction);
    logRequest(newRequest, transaction);
    if (newRequest) {
      await handleTransaction(transaction);
    }
    res.status(200).send();
  };

  return handleWebhook;
};

export default createWebhookHandler;
