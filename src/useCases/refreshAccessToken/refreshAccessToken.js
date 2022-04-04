const createRefreshAccessToken =
  ({ config, db, qs }) =>
  async (user) => {
    const clientId = config.get("clientId");
    const clientSecret = config.get("clientSecret");
    const refreshToken = await db.getRefreshToken(user);
    const params = {
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    };
    const response = await axios
      .post("https://api.monzo.com/oauth2/token", qs.stringify(params))
      .catch(handleMonzoErrors);
    await db.storeUserAccessData(response.data);
    const accessToken = response.data.access_token;
    return accessToken;
  };

export default createRefreshAccessToken;
