import createWebhookHandler from "../src/monzo/webhookHandler.js";
import createProcessTransaction from "../src/transactions/processTransaction.js";
import createRunMacros from "../src/macros/macro.js";
import createWorkers from "../src/macros/workers.js";
import defaultEvaluatingFunctions from "../src/transactions/processTransaction.js";
import defaultAxios from "axios";
import defaultAxiosRetry from "axios-retry";
import defaultConfig from "config";
import defaultCrypto from "crypto";
import defaultQs from "qs";
import defaultUrl from "url";
import defaultHandleMonzoErrors from "../src/errors/axiosErrors.js";
import createMonzoClient from "../src/monzo/monzoClient.js";
import * as defaultDb from "../src/db/dbAdapter.js";
import * as defaultColour from "../src/colourLogger.js";

const createMockWebhookService = ({
  workers: mockWorkers,
  runMacros: mockRunMacros,
  evaluatingFunctions: mockEvaluatingFunctions,
  db: mockDb,
  colour: mockColour,
  processTransaction: mockProcessTransaction,
  monzoClient: mockMonzoClient,
  axios: mockAxios,
  axiosRetry: mockAxiosRetry,
  config: mockConfig,
  crypto: mockCrypto,
  qs: mockQs,
  url: mockUrl,
  handleMonzoErrors: mockHandleMonzoErrors,
}) => {
  const monzoClientDependencies = {
    axios: mockAxios || defaultAxios,
    axiosRetry: mockAxiosRetry || defaultAxiosRetry,
    config: mockConfig || defaultConfig,
    crypto: mockCrypto || defaultCrypto,
    qs: mockQs || defaultQs,
    url: mockUrl || defaultUrl,
    handleMonzoErrors: mockHandleMonzoErrors || defaultHandleMonzoErrors,
  };
  const monzoClient =
    mockMonzoClient || createMonzoClient(monzoClientDependencies);

  const workers = mockWorkers || createWorkers(monzoClient);

  const runMacros = mockRunMacros || createRunMacros(workers);

  const processTransactionDepencies = {
    evaluatingFunctions: mockEvaluatingFunctions || defaultEvaluatingFunctions,
    runMacros,
    db: mockDb || defaultDb,
    colour: mockColour || defaultColour,
  };

  const processTransaction =
    mockProcessTransaction ||
    createProcessTransaction(processTransactionDepencies);

  const webhookHandlerDependencies = {
    processTransaction,
    db: mockDb || defaultDb,
    colour: mockColour || defaultColour,
  };

  const webhookHandler = createWebhookHandler(webhookHandlerDependencies);

  return {
    webhookHandler,
    monzoClient,
    workers,
    runMacros,
    processTransaction,
  };
};

export default createMockWebhookService;
