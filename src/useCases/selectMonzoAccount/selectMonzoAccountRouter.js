import express from "express";
import createAccountSelectionAgent from "./AccountSelectionAgent.js";
import monzo from "../../monzo/monzoApiAdapterComposer.js";
import * as db from "../../db/dbAdapter.js";

const AccountSelectionAgent = createAccountSelectionAgent({ monzo, db });

const router = express.Router();

router.get("/accounts/list", AccountSelectionAgent.listAccounts);

router.post("/accounts/select", AccountSelectionAgent.selectAccount);

export default router;
