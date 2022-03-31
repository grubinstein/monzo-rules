import axios from "axios";
import axiosRetry from "axios-retry";
import config from "config";
import crypto from "crypto";
import qs from "qs";
import url from "url";
import handleMonzoErrors from "../errors/axiosErrors.js";

let accessToken = config.get("accessToken");
const accountId = config.get("accountId");
let refreshToken;

const monzoClient = axios.create({ baseURL: "https://api.monzo.com" });
monzoClient.defaults.headers.common["Authorization"] = "Bearer " + accessToken;

monzoClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status == 403 && !originalRequest._retry) {
      console.log("Access token expired. Refreshing.");
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      monzoClient.defaults.headers.common["Authorization"] =
        "Bearer " + newAccessToken;
      return monzoClient(originalRequest);
    }
    return Promise.reject(error);
  }
);

axiosRetry(monzoClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

const refreshAccessToken = async () => {
  const clientId = config.get("clientId");
  const clientSecret = config.get("clientSecret");
  const params = new url.URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const response = await monzoClient
    .post("/oauth2/token", params.toString())
    .catch(handleMonzoErrors);
  console.log("Received new access token from Monzo");
  console.log(response.data);
  refreshToken = response.data.refresh_token;
  accessToken = response.data.access_token;
  return accessToken;
};

export const registerWebHook = async () => {
  const appUrl = config.get("appUrl");
  const webhookUrl = appUrl + "/hook";
  const webhooks = await listWebhooks();
  if (
    webhooks.find(
      (webhook) => webhook.account_id == accountId && webhook.url == webhookUrl
    )
  ) {
    return;
  }
  const params = new url.URLSearchParams({
    account_id: accountId,
    webhookUrl,
  });
  await monzoClient
    .post("/webhooks", params.toString())
    .catch(handleMonzoErrors);
};

export const listWebhooks = async () => {
  const response = await monzoClient
    .get(`/webhooks?account_id=${accountId}`)
    .catch(handleMonzoErrors);
  console.log(response.data.webhooks);
  return response.data.webhooks;
};

export const removeUnnecessaryWebhooks = async () => {
  const webhooks = await listWebhooks();
  webhooks.pop();
  for (let i = 0; i < webhooks.length; i++) {
    const webhook = webhooks[i];
    console.log(webhook);
    await monzoClient
      .delete(`/webhooks/${webhook.id}`)
      .catch(handleMonzoErrors);
  }
};

export const authorize = (req, res) => {
  const clientId = config.get("clientId");
  const appUrl = config.get("appUrl");
  const redirectUri = appUrl + "/authorizereturn";
  const stateToken = crypto.randomBytes(8).toString("hex");
  const url = `https://auth.monzo.com/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${stateToken}`;
  res.redirect(url);
};

export const authReturn = (req, res) => {
  console.log(req.params);
};

export const getPots = async () => {
  const response = await monzoClient.get(
    `/pots?current_account_id=${accountId}`
  );
  return response.data.pots;
};

const getCurrentBalance = async () => {
  const response = await monzoClient.get(`/balance?account_id=${accountId}`);
  return response.data.balance;
};

const getPot = async (potName) => {
  const pots = await getPots();
  return pots.find((p) => p.name == potName);
};

export const getPotBalance = async (potName) => {
  if (potName == "current") {
    const currentBalance = await getCurrentBalance();
    return currentBalance;
  }
  const pot = await getPot(potName);
  return pot.balance;
};

export const getPotId = async (potName) => {
  const pot = await getPot(potName);
  return pot.id;
};

export const withdraw = async (pot, amount, id) => {
  const potId = await getPotId(pot);
  const dedupe_id = id || crypto.randomBytes(16).toString("hex");
  const params = new url.URLSearchParams({
    destination_account_id: accountId,
    source_account_id: accountId,
    amount,
    dedupe_id,
  });
  await monzoClient
    .put(`/pots/${potId}/withdraw`, params.toString())
    .catch(handleMonzoErrors);
};

export const deposit = async (pot, amount, id) => {
  const potId = await getPotId(pot);
  const dedupe_id = id || crypto.randomBytes(16).toString("hex");
  const params = new url.URLSearchParams({
    destination_account_id: accountId,
    source_account_id: accountId,
    amount,
    dedupe_id,
  });
  await monzoClient
    .put(`/pots/${potId}/deposit`, params.toString())
    .catch(handleMonzoErrors);
};

export const getTransactions = async (from, to) => {
  const since = from ? new Date(from).toISOString() : undefined;
  const before = to ? new Date(to).toISOString() : undefined;
  const response = await monzoClient
    .get("/transactions", {
      params: {
        account_id: accountId,
        since,
        before,
      },
    })
    .catch(handleMonzoErrors);
  return response.data.transactions;
};

export const notify = async (
  title,
  body,
  image_url = "https://www.animatedimages.org/data/media/198/animated-frog-image-0015.gif"
) => {
  const params = {
    account_id: accountId,
    type: "basic",
    params: {
      title,
      body,
      image_url,
    },
  };
  await monzoClient
    .post(`/feed`, qs.stringify(params))
    .catch(handleMonzoErrors);
};
