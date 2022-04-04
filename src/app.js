import express from "express";
import sequelize from "./db/sequelize.js";
import bodyParser from "body-parser";
import userAuthRouter from "../src/useCases/authorizeMonzoUser/userAuthRouter.js";
import webhookRouter from "../src/useCases/handleWebhook/webhookRouter.js";
import selectMonzoAccountRouter from "../src/useCases/selectMonzoAccount/selectMonzoAccountRouter.js";

await sequelize.sync();

const app = express();

app.use(bodyParser.json());

app.use(userAuthRouter);

app.use(webhookRouter);

app.use(selectMonzoAccountRouter);

export default app;
