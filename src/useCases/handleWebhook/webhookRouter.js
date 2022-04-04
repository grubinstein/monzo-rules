import express from "express";
import webhookHandler from "./webhookHandlerComposer.js";

const router = express.Router();

router.post("/hook", webhookHandler);

export default router;
