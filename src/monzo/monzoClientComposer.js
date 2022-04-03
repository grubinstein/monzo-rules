import axios from "axios";
import axiosRetry from "axios-retry";
import config from "config";
import crypto from "crypto";
import qs from "qs";
import url from "url";
import * as db from "../db/dbAdapter.js";
import handleMonzoErrors from "../errors/axiosErrors.js";
import createMonzoClient from "../monzo/monzoClient.js";

export default await createMonzoClient({
  axios,
  axiosRetry,
  config,
  crypto,
  qs,
  url,
  handleMonzoErrors,
  db,
});
