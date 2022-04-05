import createWebhookHandler from "../src/useCases/handleWebhook/webhookHandler.js";
import createProcessTransaction from "../src/useCases/handleWebhook/processTransaction/processTransaction.js";
import createRunMacros from "../src/useCases/handleWebhook/processTransaction/runMacros/runMacros.js";
import createWorkers from "../src/useCases/handleWebhook/processTransaction/runMacros/taskWorkers.js";
import defaultEvaluatingFunctions from "../src/useCases/handleWebhook/processTransaction/filterEvaluatingFunctions.js";
import defaultAxios from "axios";
import defaultAxiosRetry from "axios-retry";
import defaultConfig from "config";
import defaultCrypto from "crypto";
import defaultQs from "qs";
import defaultHandleMonzoErrors from "../src/errors/axiosErrors.js";
import createMonzoClient from "../src/monzo/monzoApiAdapter.js";
import * as defaultDb from "../src/db/dbAdapter.js";
import * as defaultLogger from "../src/logging/colourLogger.js";

const createMockWebhookService = ({
  workers: mockWorkers,
  runMacros: mockRunMacros,
  evaluatingFunctions: mockEvaluatingFunctions,
  db: mockDb,
  logger: mockLogger,
  processTransaction: mockProcessTransaction,
  monzoClient: mockMonzoClient,
  axios: mockAxios,
  axiosRetry: mockAxiosRetry,
  config: mockConfig,
  crypto: mockCrypto,
  qs: mockQs,
  handleMonzoErrors: mockHandleMonzoErrors,
}) => {
  const monzoClientDependencies = {
    axios: mockAxios || defaultAxios,
    axiosRetry: mockAxiosRetry || defaultAxiosRetry,
    config: mockConfig || defaultConfig,
    crypto: mockCrypto || defaultCrypto,
    qs: mockQs || defaultQs,
    handleMonzoErrors: mockHandleMonzoErrors || defaultHandleMonzoErrors,
  };
  const monzoClient =
    mockMonzoClient || createMonzoClient(monzoClientDependencies);

  const workers = mockWorkers || createWorkers(monzoClient);

  const runMacros =
    mockRunMacros ||
    createRunMacros({ workers, logger: mockLogger || defaultLogger });

  const processTransactionDepencies = {
    evaluatingFunctions: mockEvaluatingFunctions || defaultEvaluatingFunctions,
    runMacros,
    db: mockDb || defaultDb,
    logger: mockLogger || defaultLogger,
  };

  const processTransaction =
    mockProcessTransaction ||
    createProcessTransaction(processTransactionDepencies);

  const webhookHandlerDependencies = {
    processTransaction,
    db: mockDb || defaultDb,
    logger: mockLogger || defaultLogger,
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
