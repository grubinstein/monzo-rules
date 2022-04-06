const createMonzoApiAdapter = async ({
  getMonzoClient,
  config,
  crypto,
  qs,
}) => {
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
    console.log("Registering webhook for user " + user.id);
    await monzoClient.post("/webhooks", qs.stringify(params));
  };

  const listWebhooks = async (user) => {
    const monzoClient = getMonzoClient(user);
    const response = await monzoClient.get(
      `/webhooks?account_id=${user.accountId}`
    );
    console.log(response.data.webhooks);
    return response.data.webhooks;
  };

  const removeUnnecessaryWebhooks = async (user) => {
    const webhooks = await listWebhooks(user);
    const monzoClient = getMonzoClient(user);
    for (let i = 0; i < webhooks.length; i++) {
      const webhook = webhooks[i];
      await monzoClient.delete(`/webhooks/${webhook.id}`);
    }
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
    if (potName == "current") {
      const currentBalance = await getCurrentBalance(user);
      return currentBalance;
    }
    const pot = await getPot(user, potName);
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
    await monzoClient.put(`/pots/${potId}/withdraw`, qs.stringify(params));
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
    await monzoClient.put(`/pots/${potId}/deposit`, qs.stringify(params));
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
    await monzoClient.post(`/feed`, qs.stringify(params));
  };

  return {
    registerWebHook,
    listWebhooks,
    getAccounts,
    removeUnnecessaryWebhooks,
    getPots,
    getPotBalance,
    getPotId,
    withdraw,
    deposit,
    getTransactions,
    notify,
  };
};

export default createMonzoApiAdapter;
