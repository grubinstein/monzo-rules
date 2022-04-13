import { jest } from "@jest/globals";
import webhookComposer from "../../../test/mockWebhookComposer.js";
import mockWebhookRequest from "../../../test/mockWebhookRequest.js";
import hash from "object-hash";

const processTransaction = jest.fn();
const logger = { log: jest.fn() };
const db = {
  addRequestIfNew: jest.fn(),
};

const webhookHandler = webhookComposer({
  processTransaction,
  logger,
  db,
}).webhookHandler;

const res = (() => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
})();

jest.useFakeTimers();

beforeEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks();
  ["status", "json", "send"].forEach((k) => {
    res[k].mockReturnValue(res);
  });
});

describe("webhook handler", () => {
  it("passes transaction to db to check if new and store", async () => {
    await webhookHandler(mockWebhookRequest, res);
    expect(db.addRequestIfNew).toHaveBeenCalled();
  });
  it("adds call type to transaction before passing to db", async () => {
    await webhookHandler(mockWebhookRequest, res);
    expect(db.addRequestIfNew.mock.calls[0][0].callType).toBe(
      "transaction.created"
    );
  });
  it("adds hash to transaction before adding call type", async () => {
    const contentHash = hash.MD5(mockWebhookRequest.body.data);
    await webhookHandler(mockWebhookRequest, res);
    expect(db.addRequestIfNew.mock.calls[0][0].hash).toBe(contentHash);
  });
  it("it logs for every webhook call", async () => {
    await webhookHandler(mockWebhookRequest, res);
    expect(logger.log).toHaveBeenCalled();
  });
  it("it logs Handling message for new transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue(true);
    await webhookHandler(mockWebhookRequest, res);
    const {
      type,
      data: { description, id },
    } = mockWebhookRequest.body;
    expect(logger.log.mock.calls[0][0]).toBe(
      `Handling: ${description} ${id} ${type}`
    );
  });
  it("it logs Repeat message for duplicate transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue(false);
    await webhookHandler(mockWebhookRequest, res);
    const {
      type,
      data: { description, id },
    } = mockWebhookRequest.body;
    expect(logger.log.mock.calls[0][0]).toBe(
      `Repeat: ${description} ${id} ${type}`
    );
  });
  it("passes id to logger", async () => {
    db.addRequestIfNew.mockReturnValue(false);
    await webhookHandler(mockWebhookRequest, res);
    expect(logger.log.mock.calls[0][1]).toBe(mockWebhookRequest.body.data.id);
  });
  it("calls processTransaction for new transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue(true);
    await webhookHandler(mockWebhookRequest, res);
    expect(processTransaction).toHaveBeenCalled();
  });
  it("passes transaction to processTransaction", async () => {
    db.addRequestIfNew.mockReturnValue(true);
    await webhookHandler(mockWebhookRequest, res);
    expect(Object.keys(processTransaction.mock.calls[0][0])).toEqual(
      expect.arrayContaining(Object.keys(mockWebhookRequest.body.data))
    );
  });
  it("returns 200", async () => {
    await webhookHandler(mockWebhookRequest, res);
    expect(res.status).toHaveBeenCalled();
    expect(res.status.mock.calls[0][0]).toBe(200);
    expect(res.send).toHaveBeenCalled();
  });
});
