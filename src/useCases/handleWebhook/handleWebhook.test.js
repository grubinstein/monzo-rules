import { jest } from "@jest/globals";
import sequelize from "../../db/sequelize.js";
import Request from "../../db/models/Request.js";
import webhookComposer from "../../../test/mockWebhookComposer.js";
import mockWebhookRequest from "../../../test/mockWebhookRequest.js";

const processTransaction = jest.fn();
const logger = { log: jest.fn() };
const webhookHandler = webhookComposer({
  processTransaction,
  logger,
}).webhookHandler;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

jest.useFakeTimers();

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await Request.destroy({ truncate: true });
});

describe("Saving requests to database", () => {
  it("saves request to database if it does not already exist", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests.length).toBe(1);
  });
  it("saves transaction ID in database if it does not already exist", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    const request = requests[0];
    expect(request.transactionId).toBe(mockWebhookRequest.data.id);
  });
  it("does not save a duplicate request", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests.length).toBe(1);
  });
  it("does save separate requests where transaction type differs", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    const mockUpdateRequest = {
      ...mockWebhookRequest,
      type: "transaction.updated",
    };
    await webhookHandler({ body: mockUpdateRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests.length).toBe(2);
  });
  it("saves callType in Request table", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests[0].callType).toBe("transaction.created");
  });
  it("calls processTransaction when request is new", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    expect(processTransaction).toBeCalled();
  });
  it("passes transaction object with callType to processTransaction", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    const transactionPassed = processTransaction.mock.calls[0][0];
    expect(Object.keys(transactionPassed)).toEqual(
      expect.arrayContaining(["id", "callType"])
    );
  });
  it("doesn't call processTransaction when request is a duplicate", async () => {
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    processTransaction.mockClear();
    await webhookHandler({ body: mockWebhookRequest }, mockResponse());
    expect(processTransaction).not.toBeCalled();
  });
  it("returns 200 okay", async () => {
    const res = mockResponse();
    await webhookHandler({ body: mockWebhookRequest }, res);
    expect(res.status).toBeCalledWith(200);
    expect(res.send).toBeCalled();
  });
});
