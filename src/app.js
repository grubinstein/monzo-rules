import express from "express";
import sequelize from "./db/sequelize.js";
import monzoClient from "./monzo/monzoClientComposer.js";
import webhookService from "./monzo/webhookHandlerComposer.js";
import bodyParser from "body-parser";

await sequelize.sync();

const app = express();

app.use(bodyParser.json());

app.get("/auth", monzoClient.authorize);

app.get("/authorizereturn", monzoClient.authReturn);

app.get("/", (req, res) => res.send("Hello"));

app.post("/hook", webhookService);

export default app;
