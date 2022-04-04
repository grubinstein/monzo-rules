import express from "express";
import axios from "axios";
import crypto from "crypto";
import config from "config";
import qs from "qs";
import * as db from "../../db/dbAdapter.js";
import handleMonzoErrors from "../../errors/axiosErrors.js";
import createUserAuthAgent from "./UserAuthAgent.js";

const router = express.Router();
const userAuthAgent = createUserAuthAgent({
  config,
  crypto,
  axios,
  qs,
  db,
  handleMonzoErrors,
});

router.get("/authorize", userAuthAgent.authorize);

router.get("/authorizereturn", userAuthAgent.handleAuthRedirect);

export default router;
