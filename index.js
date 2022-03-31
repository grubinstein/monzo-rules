import express from "express";
import sequelize from "./src/db/sequelize.js";
import {
  authorize,
  authReturn,
  registerWebHook,
} from "./src/monzo/monzoClient.js";
import bodyParser from "body-parser";
import { handleWebhookPost } from "./src/monzo/webhookHandler.js";

//mongoose.connect("mongodb://127.0.0.1:27018/monzo?replicaSet=rs0");

const app = express();

app.use(bodyParser.json());

app.get("/auth", authorize);

app.get("/authorizereturn", authReturn);

app.get("/", (req, res) => res.send("Hello"));

app.post("/hook", handleWebhookPost);

app.listen(3000, () => {
  console.log("App listening on port 3000");
});

await registerWebHook();
