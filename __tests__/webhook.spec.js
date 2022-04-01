import supertest from "supertest";
import sequelize from "../src/db/sequelize.js";
import Request from "../src/db/models/Request.js";
import app from "../src/app.js";
import mockWebhookRequest from "../test/mockWebhookRequest.js";
import { jest } from "@jest/globals";
import { processTransaction } from "../src/transactions/transactions.js";

jest.useFakeTimers();

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await Request.destroy({ truncate: true });
});

describe("Saving requests to database", () => {
  it("saves request to database if it does not already exist", async () => {
    await supertest(app).post("/hook").send(mockWebhookRequest);
    const requests = await Request.findAll();
    expect(requests.length).toBe(1);
  });
  it("saves transaction ID in database if it does not already exist", async () => {
    await supertest(app).post("/hook").send(mockWebhookRequest);
    const requests = await Request.findAll();
    const request = requests[0];
    expect(request.transactionId).toBe(mockWebhookRequest.data.id);
  });
  it("does not save a duplicate request", async () => {
    await supertest(app).post("/hook").send(mockWebhookRequest);
    await supertest(app).post("/hook").send(mockWebhookRequest);
    const requests = await Request.findAll();
    expect(requests.length).toBe(1);
  });
  it("does save separate requests where transaction type differs", async () => {
    await supertest(app).post("/hook").send(mockWebhookRequest);
    const mockUpdateRequest = {
      ...mockWebhookRequest,
      type: "transaction.updated",
    };
    await supertest(app).post("/hook").send(mockUpdateRequest);
    const requests = await Request.findAll();
    expect(requests.length).toBe(2);
  });
  it("saves callType in Request table", async () => {
    await supertest(app).post("/hook").send(mockWebhookRequest);
    const requests = await Request.findAll();
    expect(requests[0].callType).toBe("transaction.created");
  });
  it("should call processTransaction with transaction if request is new", async () => {
    jest.mock("../src/transactions/transactions.js");
    await supertest(app).post("/hook").send(mockWebhookRequest);
    expect(processTransaction).toHaveBeenCalled();
  });
});
