import express from "express";
import sequelize from "./db/sequelize.js";
import { authorize, authReturn } from "./monzo/monzoClient.js";
import webhookService from "./monzo/webhookService.js";
import bodyParser from "body-parser";

sequelize.sync();

const app = express();

app.use(bodyParser.json());

app.get("/auth", authorize);

app.get("/authorizereturn", authReturn);

app.get("/", (req, res) => res.send("Hello"));

app.post("/hook", webhookService);

export default app;
