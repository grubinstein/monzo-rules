import Models from "./relations.js";
const { Rule, Macro, User, Request } = Models;
import * as db from "./dbAdapter.js";
import { jest } from "@jest/globals";
import sequelize from "./sequelize.js";
import mockTransaction from "../../test/mockTransaction.js";

jest.useFakeTimers();

beforeAll(async () => {
  await sequelize.sync();
});

describe("storeUserAccessData", () => {
  const mockUser = {
    access_token: "access123",
    refreshToken: "refresh123",
    user_id: "monzouser123",
  };
  beforeEach(async () => {
    User.destroy({ truncate: true });
    Request.destroy({ truncate: true });
    User.create({
      email: "mail@mail.com",
      password: "923j9fijojf",
      monzoAccountId: "monzoaccount123",
      monzoUserId: "monzouser123",
    });
  });
  it("stores access data for given monzo user", async () => {
    //    await db.storeUserAccessData(mockUser);
  });
});

describe("mostRecentRequest", () => {
  it("returns true if no requests with the same transactionId exist", async () => {
    await Request.create({
      transactionId: "12345",
      hash: "12309jfejiooskefnk",
      callType: "transaction.created",
      transaction: mockTransaction,
    });
    const result = await db.mostRecentRequest(mockTransaction.id, 1);
    expect(result).toBe(true);
  });
  it("returns true if older request exists with same transactionId", async () => {
    await Request.create({
      transactionId: "tx_0000AHzLvcFBuOcELkER18",
      hash: "12309jfejiooskefnk",
      callType: "transaction.created",
      transaction: mockTransaction,
    });
    const result = await db.mostRecentRequest(mockTransaction.id, 3);
    expect(result).toBe(true);
  });
  it("returns false if newer request exists with same transactionId", async () => {
    await Request.create({
      transactionId: "tx_0000AHzLvcFBuOcELkER18",
      hash: "12309jfejiooskefnk",
      callType: "transaction.created",
      transaction: mockTransaction,
    });
    await Request.create({
      transactionId: "tx_0000AHzLvcFBuOcELkER18",
      hash: "12309jfejiooskefnk",
      callType: "transaction.created",
      transaction: mockTransaction,
    });
    const result = await db.mostRecentRequest(mockTransaction.id, 1);
    expect(result).toBe(false);
  });
});
