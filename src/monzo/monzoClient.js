import readline from "readline";

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

const createMonzoClient = async ({
  axios,
  axiosRetry,
  config,
  crypto,
  qs,
  url,
  handleMonzoErrors,
  db,
}) => {
  const getMonzoClient = async (user) => {
    const { accessToken, accountId } = user;
    const monzoClient = axios.create({ baseURL: "https://api.monzo.com" });

    monzoClient.defaults.headers.common["Authorization"] =
      "Bearer " + accessToken;

    monzoClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response.data.code == "forbidden.insufficient_permissions") {
          console.log("Monzo returned insufficient permissions error");
          await askQuestion("Have you granted permissions in the app?");
          return monzoClient(originalRequest).catch(handleMonzoErrors);
        }
        if (error.response.status == 403 && !originalRequest._retry) {
          console.log("Access token expired. Refreshing.");
          originalRequest._retry = true;
          const newAccessToken = await refreshAccessToken(user);
          monzoClient.defaults.headers.common["Authorization"] =
            "Bearer " + newAccessToken;
          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
          return monzoClient(originalRequest).catch(handleMonzoErrors);
        }
        return Promise.reject(error);
      }
    );

    axiosRetry(monzoClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });

    return monzoClient;
  };

  const refreshAccessToken = async (user) => {
    const clientId = config.get("clientId");
    const clientSecret = config.get("clientSecret");
    const refreshToken = await db.getRefreshToken(user);
    const params = new url.URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const response = await axios
      .post("https://api.monzo.com/oauth2/token", params.toString())
      .catch(handleMonzoErrors);
    await db.storeUserAccessData(response.data);
    const accessToken = response.data.access_token;
    return accessToken;
  };

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
    const params = new url.URLSearchParams({
      account_id: user.accountId,
      url: webhookUrl,
    });
    const monzoClient = await getMonzoClient(user);
    console.log("Registering webhook for user " + user.id);
    await monzoClient
      .post("/webhooks", params.toString())
      .catch(handleMonzoErrors);
  };

  const listWebhooks = async (user) => {
    const monzoClient = await getMonzoClient(user);
    const response = await monzoClient
      .get(`/webhooks?account_id=${user.accountId}`)
      .catch(handleMonzoErrors);
    return response.data.webhooks;
  };

  const removeUnnecessaryWebhooks = async (user) => {
    const webhooks = await listWebhooks(user);
    const monzoClient = await getMonzoClient(user);
    for (let i = 0; i < webhooks.length; i++) {
      const webhook = webhooks[i];
      await monzoClient
        .delete(`/webhooks/${webhook.id}`)
        .catch(handleMonzoErrors);
    }
  };

  const authorize = (req, res) => {
    const clientId = config.get("clientId");
    const httpsAppUrl = config.get("httpsAppUrl");
    const redirectUri = httpsAppUrl + "/authorizereturn";
    const stateToken = crypto.randomBytes(32).toString("hex");
    //store stateToken
    const url = `https://auth.monzo.com/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${stateToken}`;
    res.redirect(url);
  };

  const authReturn = async (req, res) => {
    const { code, state } = req.query;
    //check stateToken
    const client_id = config.get("clientId");
    const client_secret = config.get("clientSecret");
    const httpsAppUrl = config.get("httpsAppUrl");
    const redirect_uri = httpsAppUrl + "/authorizereturn";
    const params = {
      grant_type: "authorization_code",
      client_id,
      client_secret,
      redirect_uri,
      code,
    };
    const response = await axios
      .post(`https://api.monzo.com/oauth2/token`, qs.stringify(params))
      .catch(handleMonzoErrors);
    const user = await db.storeUserAccessData(response.data);
    res.send("Thanks for authorizing");
    await addDefaultAccountId(user);
    await registerWebHook(user);
  };

  const addDefaultAccountId = async (user) => {
    const accounts = await getAccounts(user);
    const accountId = accounts[0].id;
    await db.setAccountId(user, accountId);
  };

  const getAccounts = async (user) => {
    const monzoClient = await getMonzoClient(user);
    const response = await monzoClient.get(`/accounts?account_type=uk_retail`);
    return response.data.accounts;
  };

  const getPots = async (user) => {
    const monzoClient = await getMonzoClient(user);
    const response = await monzoClient.get(
      `/pots?current_account_id=${user.accountId}`
    );
    return response.data.pots;
  };

  const getCurrentBalance = async (user) => {
    const monzoClient = await getMonzoClient(user);
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
    const params = new url.URLSearchParams({
      destination_account_id: user.accountId,
      source_account_id: user.accountId,
      amount,
      dedupe_id,
    });
    const monzoClient = await getMonzoClient(user);
    await monzoClient
      .put(`/pots/${potId}/withdraw`, params.toString())
      .catch(handleMonzoErrors);
  };

  const deposit = async (user, pot, amount, id) => {
    const potId = await getPotId(user, pot);
    const dedupe_id = id || crypto.randomBytes(16).toString("hex");
    const params = new url.URLSearchParams({
      destination_account_id: user.accountId,
      source_account_id: user.accountId,
      amount,
      dedupe_id,
    });
    const monzoClient = await getMonzoClient(user);
    await monzoClient
      .put(`/pots/${potId}/deposit`, params.toString())
      .catch(handleMonzoErrors);
  };

  const getTransactions = async (user, from, to) => {
    const since = from ? new Date(from).toISOString() : undefined;
    const before = to ? new Date(to).toISOString() : undefined;
    const monzoClient = await getMonzoClient(user);
    const response = await monzoClient
      .get("/transactions", {
        params: {
          account_id: user.accountId,
          since,
          before,
        },
      })
      .catch(handleMonzoErrors);
    return response.data.transactions;
  };

  const notify = async (
    user,
    title,
    body,
    image_url = "https://www.animatedimages.org/data/media/198/animated-frog-image-0015.gif"
  ) => {
    const params = {
      account_id: user.accountId,
      type: "basic",
      params: {
        title,
        body,
        image_url,
      },
    };
    const monzoClient = await getMonzoClient(user);
    await monzoClient
      .post(`/feed`, qs.stringify(params))
      .catch(handleMonzoErrors);
  };

  return {
    registerWebHook,
    listWebhooks,
    removeUnnecessaryWebhooks,
    authorize,
    authReturn,
    getPots,
    getPotBalance,
    getPotId,
    withdraw,
    deposit,
    getTransactions,
    notify,
  };
};

export default createMonzoClient;
