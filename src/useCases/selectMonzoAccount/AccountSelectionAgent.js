const createAccountSelectionAgent = ({ monzo, db }) => {
  const listAccounts = async (req, res) => {
    const { user } = req;
    //Handle errors
    const accounts = await monzo.getAccounts(user);
    return res.json(accounts);
  };

  const selectAccount = async (req, res) => {
    const { accountId } = req.body;
    await db.setAccountId(user, accountId);
    await monzo.registerWebHook(user);
    //Handle errors
    return res.status(200).send();
  };

  return { listAccounts, selectAccount };
};

export default createAccountSelectionAgent;
