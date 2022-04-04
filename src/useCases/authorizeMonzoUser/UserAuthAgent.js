const createUserAuthAgent = ({
  config,
  crypto,
  axios,
  qs,
  db,
  handleMonzoErrors,
}) => {
  const authorize = (req, res) => {
    const clientId = config.get("clientId");
    const httpsAppUrl = config.get("httpsAppUrl");
    const redirectUri = httpsAppUrl + "/authorizereturn";
    const stateToken = crypto.randomBytes(32).toString("hex");
    //store stateToken
    const url = `https://auth.monzo.com/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${stateToken}`;
    res.redirect(url);
  };

  const handleAuthRedirect = async (req, res) => {
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
    //Redirect user to account selection page if no account selected
    res.send("Thanks for authorizing");
  };

  return {
    authorize,
    handleAuthRedirect,
  };
};

export default createUserAuthAgent;
