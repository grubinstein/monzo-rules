import createWebhookHandler from "./webhookHandler.js";
import createProcessTransaction from "../processTransaction/processTransaction.js";
import createRunMacros from "../runMacros/runMacros.js";
import createWorkers from "../runMacros/taskWorkers.js";
import monzo from "../../monzo/monzoApiAdapterComposer.js";
import evaluatingFunctions from "../processTransaction/filterEvaluatingFunctions.js";
import * as db from "../../db/dbAdapter.js";
import * as logger from "../../logging/colourLogger.js";

const workers = createWorkers(monzo);

const runMacros = createRunMacros({ workers, logger });

const processTransactionDepencies = {
  evaluatingFunctions,
  runMacros,
  db,
  logger,
};

const processTransaction = createProcessTransaction(
  processTransactionDepencies
);

const webhookHandlerDependencies = {
  processTransaction,
  db,
  logger,
};

const webhookHandler = createWebhookHandler(webhookHandlerDependencies);

export default webhookHandler;
