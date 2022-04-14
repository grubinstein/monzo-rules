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

const mockUser = {
  email: "user@mail.com",
  accessToken: "access123",
  refreshToken: "refresh123",
  monzoUserId: "monzouser123",
  password: "pass1234",
  monzoAccountId: "monzoaccount123",
};

describe("getUserByAccountId", () => {
  it("throws error if no accountId provided", async () => {
    const runWithoutId = () => db.getUserByAccountId();
    expect(runWithoutId).rejects.toThrow();
  });
  it("returns correct user", async () => {
    await User.create(mockUser);
    const user = await db.getUserByAccountId("monzoaccount123");
    expect(user).toEqual(expect.objectContaining(mockUser));
  });
});

describe("getRefreshToken", () => {
  it("throws error if no user is provided", async () => {
    const runWithoutUser = () => db.getRefreshToken();
    expect(runWithoutUser).rejects.toThrow();
  });
  it("throws error if user is missing id", async () => {
    const runWithoutId = () => db.getRefreshToken(mockUser);
    expect(runWithoutId).rejects.toThrow("User does not contain ID");
  });
  it("returns correct refreshToken", async () => {
    const user = await User.create(mockUser);
    const refreshToken = await db.getRefreshToken(user);
    expect(refreshToken).toBe("refresh123");
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
