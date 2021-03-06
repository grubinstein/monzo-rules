const createGetMonzoClient = ({
  axios,
  axiosRetry,
  readline,
  config,
  db,
  logger,
  handleMonzoErrors,
  qs,
}) => {
  const askQuestion = (query) => {
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
  };

  const getMonzoClient = (user) => {
    const { accessToken } = user;
    const monzoAxiosClient = axios.create({ baseURL: "https://api.monzo.com" });
    monzoAxiosClient.defaults.headers.common["Authorization"] =
      "Bearer " + accessToken;

    axiosRetry(monzoAxiosClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });

    const askForPermissionsAndRetry = async (originalRequest) => {
      logger.log("Monzo returned insufficient permissions error");
      await askQuestion("Have you granted permissions in the app?");
      //Throw insufficient permissions error to catch elsewhere and prompt user
      return monzoAxiosClient(originalRequest).catch(handleMonzoErrors);
    };

    const getNewAccessTokenAndRetry = async (originalRequest) => {
      logger.log("Access token expired. Refreshing.");
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken(user);
      const accessTokenHeader = "Bearer " + newAccessToken;
      monzoAxiosClient.defaults.headers.common["Authorization"] =
        accessTokenHeader;
      originalRequest.headers["Authorization"] = accessTokenHeader;
      return monzoAxiosClient(originalRequest).catch(handleMonzoErrors);
    };

    const refreshAccessToken = async (user) => {
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

    monzoAxiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response.data.code == "forbidden.insufficient_permissions") {
          const retriedRequest = await askForPermissionsAndRetry(
            originalRequest
          );
          return retriedRequest;
        }
        if (error.response.status == 403 && !originalRequest._retry) {
          const retriedRequest = await getNewAccessTokenAndRetry(
            originalRequest
          );
          return retriedRequest;
        }
        return Promise.reject(error);
      }
    );

    const monzoClient = {
      post: async (url, params) => {
        const response = await monzoAxiosClient
          .post(url, qs.stringify(params))
          .catch(handleMonzoErrors);
        return response;
      },
      get: async (...args) => {
        const response = await monzoAxiosClient
          .get(...args)
          .catch(handleMonzoErrors);
        return response;
      },
      delete: async (...args) => {
        const response = await monzoAxiosClient
          .delete(...args)
          .catch(handleMonzoErrors);
        return response;
      },
      put: async (url, params) => {
        const response = await monzoAxiosClient
          .post(url, qs.stringify(params))
          .catch(handleMonzoErrors);
        return response;
      },
    };

    return monzoClient;
  };

  return getMonzoClient;
};

export default createGetMonzoClient;
