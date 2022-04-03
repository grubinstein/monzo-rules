import createWebhookHandler from "./webhookHandler.js";
import createProcessTransaction from "../transactions/processTransaction.js";
import createRunMacros from "../macros/macro.js";
import createWorkers from "../macros/workers.js";
import monzoClient from "./monzoClientComposer.js";
import evaluatingFunctions from "../transactions/evaluations.js";
import * as db from "../db/dbAdapter.js";
import * as colour from "../colourLogger.js";

const workers = createWorkers(monzoClient);

const runMacros = createRunMacros(workers, colour);

const processTransactionDepencies = {
  evaluatingFunctions,
  runMacros,
  db,
  colour,
};

const processTransaction = createProcessTransaction(
  processTransactionDepencies
);

const webhookHandlerDependencies = {
  processTransaction,
  db,
  colour,
};

const webhookHandler = createWebhookHandler(webhookHandlerDependencies);

export default webhookHandler;
