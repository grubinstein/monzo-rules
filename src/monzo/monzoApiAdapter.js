const createMonzoApiAdapter = ({ getMonzoClient, config, crypto }) => {
  const registerWebHook = async (user) => {
    const appUrl = config.get("appUrl");
    const webhookUrl = appUrl + "/hook";
    const webhooks = await listWebhooks(user);
    if (
      webhooks.find(
        (webhook) =>
          webhook.account_id == user.accountId && webhook.url == webhookUrl
      )
    ) {
      return;
    }
    const params = {
      account_id: user.accountId,
      url: webhookUrl,
    };
    const monzoClient = getMonzoClient(user);
    await monzoClient.post("/webhooks", params);
  };

  const listWebhooks = async (user) => {
    const monzoClient = getMonzoClient(user);
    const response = await monzoClient.get(
      `/webhooks?account_id=${user.accountId}`
    );
    return response.data.webhooks;
  };

  const getAccounts = async (user) => {
    const monzoClient = getMonzoClient(user);
    const response = await monzoClient.get(`/accounts?account_type=uk_retail`);
    return response.data.accounts;
  };

  const getPots = async (user) => {
    const monzoClient = getMonzoClient(user);
    const response = await monzoClient.get(
      `/pots?current_account_id=${user.accountId}`
    );
    return response.data.pots;
  };

  const getCurrentBalance = async (user) => {
    const monzoClient = getMonzoClient(user);
    const response = await monzoClient.get(
      `/balance?account_id=${user.accountId}`
    );
    return response.data.balance;
  };

  const getPot = async (user, potName) => {
    const pots = await getPots(user);
    return pots.find((p) => p.name == potName);
  };

  const getPotBalance = async (user, potName) => {
    if (potName == "current" || potName == "Current") {
      const currentBalance = await getCurrentBalance(user);
      return currentBalance;
    }
    const pot = await getPot(user, potName);
    if (!pot) {
      throw new Error("Pot could not be found.");
    }
    return pot.balance;
  };

  const getPotId = async (user, potName) => {
    const pot = await getPot(user, potName);
    return pot.id;
  };

  const withdraw = async (user, potName, amount, id) => {
    const potId = await getPotId(user, potName);
    const dedupe_id = id || crypto.randomBytes(16).toString("hex");
    const params = {
      destination_account_id: user.accountId,
      source_account_id: user.accountId,
      amount,
      dedupe_id,
    };
    const monzoClient = getMonzoClient(user);
    await monzoClient.put(`/pots/${potId}/withdraw`, params);
  };

  const deposit = async (user, pot, amount, id) => {
    const potId = await getPotId(user, pot);
    const dedupe_id = id || crypto.randomBytes(16).toString("hex");
    const params = {
      destination_account_id: user.accountId,
      source_account_id: user.accountId,
      amount,
      dedupe_id,
    };
    const monzoClient = getMonzoClient(user);
    await monzoClient.put(`/pots/${potId}/deposit`, params);
  };

  const getTransactions = async (user, from, to) => {
    const since = from ? new Date(from).toISOString() : undefined;
    const before = to ? new Date(to).toISOString() : undefined;
    const monzoClient = getMonzoClient(user);
    const response = await monzoClient.get("/transactions", {
      params: {
        account_id: user.accountId,
        since,
        before,
      },
    });
    return response.data.transactions;
  };

  const notify = async (
    user,
    title,
    body,
    url,
    image_url = "https://www.animatedimages.org/data/media/198/animated-frog-image-0015.gif"
  ) => {
    const params = {
      account_id: user.accountId,
      type: "basic",
      url,
      params: {
        title,
        body,
        image_url,
      },
    };
    const monzoClient = getMonzoClient(user);
    await monzoClient.post(`/feed`, params);
  };

  return {
    registerWebHook,
    listWebhooks,
    getAccounts,
    getPots,
    getPotBalance,
    withdraw,
    deposit,
    getTransactions,
    notify,
  };
};

export default createMonzoApiAdapter;
