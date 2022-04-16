import { jest } from "@jest/globals";
import webhookComposer from "../../../test/mockWebhookComposer.js";
import mockWebhookRequest from "../../../test/mockWebhookRequest.js";
import hash from "object-hash";

const processTransaction = jest.fn();
const logger = { log: jest.fn() };
const db = {
  addRequestIfNew: jest.fn(),
  mostRecentRequest: jest.fn(),
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

beforeEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks();
  ["status", "json", "send"].forEach((k) => {
    res[k].mockReturnValue(res);
  });
  db.mostRecentRequest.mockReturnValue(true);
  db.addRequestIfNew.mockReturnValue([false]);
});

describe("webhook handler", () => {
  it("passes transaction to db to check if new and store", async () => {
    await webhookHandler(mockWebhookRequest, res);
    expect(db.addRequestIfNew).toHaveBeenCalled();
  });
  it("adds hash to transaction before passing to db", async () => {
    const contentHash = hash.MD5(mockWebhookRequest.body.data);
    await webhookHandler(mockWebhookRequest, res);
    expect(db.addRequestIfNew.mock.calls[0][0].hash).toBe(contentHash);
  });
  it("it logs for every webhook call", async () => {
    await webhookHandler(mockWebhookRequest, res);
    expect(logger.log).toHaveBeenCalled();
  });
  it("it logs Handling message for new transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue([true]);
    await webhookHandler(mockWebhookRequest, res);
    const {
      data: { description, id },
    } = mockWebhookRequest.body;
    expect(logger.log.mock.calls[0][0]).toBe(`Handling: ${description} ${id}`);
  });
  it("it logs Repeat message for duplicate transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue([false]);
    await webhookHandler(mockWebhookRequest, res);
    const {
      data: { description, id },
    } = mockWebhookRequest.body;
    expect(logger.log.mock.calls[0][0]).toBe(`Repeat: ${description} ${id}`);
  });
  it("doesn't call processTransaction for duplicate transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue([false]);
    await webhookHandler(mockWebhookRequest, res);
    expect(processTransaction).not.toHaveBeenCalled();
  });
  it("passes transactionId and createdRequestId to mostRecentRequest if request stored", async () => {
    db.addRequestIfNew.mockReturnValue([true, 2]);
    await webhookHandler(mockWebhookRequest, res);
    expect(db.mostRecentRequest).toHaveBeenCalled();
    expect(db.mostRecentRequest.mock.calls[0]).toEqual([
      mockWebhookRequest.body.data.id,
      2,
    ]);
  });
  it("doesn't call processTransaction if newer request is stored within 10 seconds", async () => {
    db.addRequestIfNew.mockReturnValue([true]);
    db.mostRecentRequest.mockReturnValue(false);
    await webhookHandler(mockWebhookRequest, res);
    expect(processTransaction).not.toHaveBeenCalled();
  });
  it("logs Repeat message if newer request is stored within 1 second", async () => {
    db.addRequestIfNew.mockReturnValue([true]);
    db.mostRecentRequest.mockReturnValue(false);
    await webhookHandler(mockWebhookRequest, res);
    const {
      data: { description, id },
    } = mockWebhookRequest.body;
    expect(logger.log.mock.calls[0][0]).toBe(`Repeat: ${description} ${id}`);
  });
  it("passes id to logger", async () => {
    db.addRequestIfNew.mockReturnValue([false]);
    await webhookHandler(mockWebhookRequest, res);
    expect(logger.log.mock.calls[0][1]).toBe(mockWebhookRequest.body.data.id);
  });
  it("calls processTransaction for new transactions/updates", async () => {
    db.addRequestIfNew.mockReturnValue([true]);
    await webhookHandler(mockWebhookRequest, res);
    expect(processTransaction).toHaveBeenCalled();
  });
  it("passes transaction to processTransaction", async () => {
    db.addRequestIfNew.mockReturnValue([true]);
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
