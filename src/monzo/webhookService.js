import { processTransaction } from "../transactions/transactions.js";
import createWebhookService from "./createWebhookService.js";

const webhookService = createWebhookService(processTransaction);

export default webhookService;
