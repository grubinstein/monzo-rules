import { jest } from "@jest/globals";
import sequelize from "../src/db/sequelize.js";
import Request from "../src/db/models/Request.js";
import createWebhookService from "../src/monzo/createWebhookService.js";
import mockWebhookRequest from "../test/mockWebhookRequest.js";

const processTransaction = jest.fn();
const webhookService = createWebhookService(processTransaction);

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
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests.length).toBe(1);
  });
  it("saves transaction ID in database if it does not already exist", async () => {
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    const request = requests[0];
    expect(request.transactionId).toBe(mockWebhookRequest.data.id);
  });
  it("does not save a duplicate request", async () => {
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests.length).toBe(1);
  });
  it("does save separate requests where transaction type differs", async () => {
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    const mockUpdateRequest = {
      ...mockWebhookRequest,
      type: "transaction.updated",
    };
    await webhookService({ body: mockUpdateRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests.length).toBe(2);
  });
  it("saves callType in Request table", async () => {
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    const requests = await Request.findAll();
    expect(requests[0].callType).toBe("transaction.created");
  });
  it("calls processTransaction when request is new", async () => {
    await webhookService({ body: mockWebhookRequest }, mockResponse());
    expect(processTransaction).toBeCalled();
  });
});
