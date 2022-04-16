import Models from "./relations.js";
const { Rule, Macro, User, Request } = Models;
import * as db from "./dbAdapter.js";
import sequelize from "./sequelize.js";
import mockTransaction from "../../test/mockTransaction.js";

beforeAll(async () => {
  await sequelize.sync();
});

let mockUser;
mockUser = {
  email: "user@mail.com",
  accessToken: "access123",
  refreshToken: "refresh123",
  monzoUserId: "monzouser123",
  password: "pass1234",
  monzoAccountId: "monzoaccount123",
};

const wait = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

beforeEach(async () => {
  await User.destroy({ truncate: true });
  mockUser = {
    email: "user@mail.com",
    accessToken: "access123",
    refreshToken: "refresh123",
    monzoUserId: "monzouser123",
    password: "pass1234",
    monzoAccountId: "monzoaccount123",
  };
});

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

describe("setAccountId", () => {
  it("throws error if no user provided", async () => {
    const runWithoutUser = () => db.setAccountId(undefined, "monzoaccount456");
    expect(runWithoutUser).rejects.toThrow();
  });
  it("throws error if no accountId provided", async () => {
    delete mockUser.monzoAccountId;
    const runWithoutAccountId = () => db.setAccountId(mockUser);
    expect(runWithoutAccountId).rejects.toThrow();
  });
  it("sets account ID", async () => {
    delete mockUser.monzoAccountId;
    const user = await User.create(mockUser);
    await db.setAccountId(user, "monzoaccount456");
    const users = await User.findAll();
    expect(users[0].monzoAccountId).toBe("monzoaccount456");
  });
});

describe("getUserIdByEmail", () => {
  it("throws error if no email provided", async () => {
    const runWithoutEmail = () => db.getUserIdByEmail();
    expect(runWithoutEmail).rejects.toThrow();
  });
  it("provides correct user ID", async () => {
    const user = await User.create(mockUser);
    const id = await db.getUserIdByEmail("user@mail.com");
    expect(id).toBe(user.id);
  });
});

describe("mostRecentRequest", () => {
  it("returns true if no requests with the same transactionId exist", async () => {
    await Request.create({
      transactionId: "12345",
      hash: "12309jfejiooskefnk",
      transaction: mockTransaction,
    });
    const result = await db.mostRecentRequest(mockTransaction.id, 1);
    expect(result).toBe(true);
  });
  it("returns true if older request exists with same transactionId", async () => {
    await Request.create({
      transactionId: "tx_0000AHzLvcFBuOcELkER18",
      hash: "12309jfejiooskefnk",
      transaction: mockTransaction,
    });
    const result = await db.mostRecentRequest(mockTransaction.id, 3);
    expect(result).toBe(true);
  });
  it("returns false if newer request exists with same transactionId", async () => {
    await Request.create({
      transactionId: "tx_0000AHzLvcFBuOcELkER18",
      hash: "12309jfejiooskefnk",
      transaction: mockTransaction,
    });
    await Request.create({
      transactionId: "tx_0000AHzLvcFBuOcELkER18",
      hash: "12309jfejiooskefnk",
      transaction: mockTransaction,
    });
    const result = await db.mostRecentRequest(mockTransaction.id, 1);
    expect(result).toBe(false);
  });
});

let numRequests;

describe("addRequestIfNew", () => {
  beforeEach(async () => {
    await Request.destroy({ truncate: true });
    await Request.bulkCreate([
      {
        transactionId: "trans1",
        transaction: {
          id: "trans1",
          hash: "hash1",
          transaction: { some: "json", data: "here" },
        },
        hash: "hash1",
      },
    ]);
    numRequests = await Request.count();
  });

  it("doesn't store if request with same transactionId and hash exists", async () => {
    const transaction = {
      id: "trans1",
      transaction: { some: "json" },
      hash: "hash1",
    };
    await db.addRequestIfNew(transaction);
    const newNumRequests = await Request.count();
    expect(newNumRequests).toBe(numRequests);
  });
  it("doesn't store if request with same transactionId, longer json exists from within last second", async () => {
    const transaction = {
      id: "trans1",
      hash: "hash2",
      transaction: { some: "json", data: "ere" },
    };
    await db.addRequestIfNew(transaction);
    const newNumRequests = await Request.count();
    expect(newNumRequests).toBe(numRequests);
  });
  it("stores if request has different transactionId", async () => {
    const transaction = {
      id: "trans2",
      hash: "hash1",
      transaction: { some: "json", data: "here" },
    };
    await db.addRequestIfNew(transaction);
    const newNumRequests = await Request.count();
    expect(newNumRequests).toBe(numRequests + 1);
  });
  it("stores if request has same transactionId, different hash and longer json", async () => {
    const transaction = {
      id: "trans1",
      hash: "hash2",
      transaction: { some: "json", data: "there" },
    };
    await db.addRequestIfNew(transaction);
    const newNumRequests = await Request.count();
    expect(newNumRequests).toBe(numRequests + 1);
  });
  it("stores if request has same transacitonId, different hash and is created more than 1 second later", async () => {
    await wait(1001);
    const transaction = {
      id: "trans1",
      hash: "hash2",
      transaction: { some: "json", data: "here" },
    };
    await db.addRequestIfNew(transaction);
    const newNumRequests = await Request.count();
    expect(newNumRequests).toBe(numRequests + 1);
  });
  it("returns false in first element if not created", async () => {
    const transaction = {
      id: "trans1",
      transaction: { some: "json" },
      hash: "hash1",
    };
    const result = await db.addRequestIfNew(transaction);
    expect(result[0]).toBe(false);
  });
  it("returns true in first element if created", async () => {
    const transaction = {
      id: "trans2",
      hash: "hash1",
      transaction: { some: "json", data: "here" },
    };
    const result = await db.addRequestIfNew(transaction);
    expect(result[0]).toBe(true);
  });
  it("returns request in second element if created", async () => {
    const transaction = {
      id: "trans2",
      hash: "hash1",
      transaction: { some: "json", data: "here" },
    };
    const result = await db.addRequestIfNew(transaction);
    const request = await Request.findOne({
      where: {
        transactionId: "trans2",
        hash: "hash1",
      },
    });
    expect(result[1]).toEqual(expect.objectContaining(request.dataValues));
  });
  it("stores transactionId, hash, and transaction", async () => {
    const transaction = {
      id: "trans2",
      hash: "hash1",
      transaction: { some: "json", data: "here" },
    };
    const result = await db.addRequestIfNew(transaction);
    const storedRequest = await Request.findByPk(result[1].id);
    expect(storedRequest).toEqual(
      expect.objectContaining({
        transactionId: "trans2",
        hash: "hash1",
        transaction: {
          id: "trans2",
          hash: "hash1",
          transaction: { some: "json", data: "here" },
        },
      })
    );
  });
});

