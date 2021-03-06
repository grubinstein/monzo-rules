import axios from "axios";
import axiosRetry from "axios-retry";
import readline from "readline";
import config from "config";
import crypto from "crypto";
import qs from "qs";
import * as db from "../db/dbAdapter.js";
import * as logger from "../logging/colourLogger.js";
import handleMonzoErrors from "../errors/axiosErrors.js";
import createMonzoApiAdapter from "./monzoApiAdapter.js";
import createGetMonzoClient from "./monzoClient.js";

const getMonzoClient = createGetMonzoClient({
  axios,
  axiosRetry,
  readline,
  db,
  config,
  logger,
  handleMonzoErrors,
  qs,
});

const monzoApiAdapter = await createMonzoApiAdapter({
  getMonzoClient,
  config,
  crypto,
});

export default monzoApiAdapter;
