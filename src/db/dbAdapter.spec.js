import Models from "./relations.js";
const { User, Request, Rule, Macro } = Models;
import * as db from "./dbAdapter.js";
import sequelize from "./sequelize.js";
import mockTransaction from "../../test/mockTransaction.js";

beforeAll(async () => {
  await sequelize.sync();
});

const wait = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

describe("user management", () => {
  let mockUser;
  beforeEach(async () => {
    mockUser = {
      email: "user@mail.com",
      accessToken: "access123",
      refreshToken: "refresh123",
      monzoUserId: "monzouser123",
      password: "pass1234",
      monzoAccountId: "monzoaccount123",
    };
  });
  afterEach(async () => {
    await User.destroy({ truncate: true });
  });
  describe("storeUserAccessData", () => {
    it("updates correct user", async () => {
      await User.create(mockUser);
      await db.storeUserAccessData({
        access_token: "access789",
        refresh_token: "refresh789",
        user_id: "monzouser123",
      });
      const user = await User.findOne({
        where: { monzoUserId: "monzouser123" },
      });
      expect(user.accessToken).toBe("access789");
      expect(user.refreshToken).toBe("refresh789");
    });
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
      const runWithoutUser = () =>
        db.setAccountId(undefined, "monzoaccount456");
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
    it("throws error if matching user not found", async () => {
      const runWithoutUser = () => db.getUserIdByEmail("some@email.com");
      expect(runWithoutUser).rejects.toThrow();
    });
    it("provides correct user ID", async () => {
      const user = await User.create(mockUser);
      const id = await db.getUserIdByEmail("user@mail.com");
      expect(id).toBe(user.id);
    });
  });
});

describe("request management", () => {
  let numRequests;
  afterEach(async () => {
    await Request.destroy({ truncate: true });
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

  describe("addRequestIfNew", () => {
    beforeEach(async () => {
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
      await wait(2011);
      const transaction = {
        id: "trans1",
        hash: "hash2",
        transaction: { some: "json", data: "here" },
      };
      await db.addRequestIfNew(transaction);
      const newNumRequests = await Request.count();
      expect(newNumRequests).toBe(numRequests + 1);
    });
    it("stores only one of simultaneous requests", async () => {
      const transaction = {
        id: "trans5",
        hash: "hash5",
        transaction: { some: "json", data: "here" },
      };
      await Promise.all([
        db.addRequestIfNew(transaction).catch((e) => e),
        db.addRequestIfNew(transaction).catch((e) => e),
      ]);
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
      expect(request.dataValues).toEqual(
        expect.objectContaining(result[1].dataValues)
      );
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

  describe("logProcessingAndPrimality", () => {
    beforeEach(async () => {
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
        {
          transactionId: "trans1",
          transaction: {
            id: "trans1",
            hash: "hash2",
            transaction: { some: "json", data: "here" },
          },
          hash: "hash2",
        },
        {
          transactionId: "trans2",
          transaction: {
            id: "trans2",
            hash: "hash2",
            transaction: { some: "json", data: "here" },
          },
          hash: "hash2",
          firstProcessed: true,
          processingStarted: new Date(),
        },
      ]);
      numRequests = await Request.count();
    });
    it("stores processing started", async () => {
      const transaction = {
        id: "trans1",
        transaction: { some: "json" },
        hash: "hash1",
      };
      await db.logProcessingAndPrimality(transaction);
      const request = await Request.findOne({
        where: { transactionId: "trans1", hash: "hash1" },
      });
      expect(request.processingStarted instanceof Date).toBe(true);
    });
    it("stores firstProcessed if no processed request with same transactionId exists", async () => {
      const transaction = {
        id: "trans1",
        transaction: { some: "json" },
        hash: "hash1",
      };
      await db.logProcessingAndPrimality(transaction);
      const request = await Request.findOne({
        where: { transactionId: "trans1", hash: "hash1" },
      });
      expect(request.firstProcessed).toBe(true);
    });
    it("stores firstProcessed on transaction object if no processed request with same transId exists", async () => {
      const transaction = {
        id: "trans1",
        transaction: { some: "json" },
        hash: "hash1",
      };
      await db.logProcessingAndPrimality(transaction);
      expect(transaction.firstProcessed).toBe(true);
    });
    it("stores firstProcessed false if processed request with same transactionId exists", async () => {
      const transaction = {
        id: "trans2",
        transaction: { some: "json" },
        hash: "hash2",
      };
      await db.logProcessingAndPrimality(transaction);
      const request = await Request.findOne({
        where: { transactionId: "trans2", hash: "hash2" },
      });
      expect(request.firstProcessed).toBe(false);
    });
    it("stores firstProcessed false on transaction object if processed request with same transId exists", async () => {
      const transaction = {
        id: "trans2",
        transaction: { some: "json" },
        hash: "hash2",
      };
      await db.logProcessingAndPrimality(transaction);
      expect(transaction.firstProcessed).toBe(false);
    });
    it("stores max one transaction as first processed", async () => {
      const trans1 = {
        id: "trans1",
        transaction: { some: "json" },
        hash: "hash1",
      };
      const trans2 = {
        id: "trans1",
        transaction: { some: "json" },
        hash: "hash2",
      };
      await Promise.all([
        db.logProcessingAndPrimality(trans1).catch((e) => e),
        db.logProcessingAndPrimality(trans2).catch((e) => e),
      ]);
      expect(
        (trans1.firstProcessed && !(trans1.firstProcessed instanceof Error)) ||
          (trans2.firstProcessed && !(trans2.firstProcessed instanceof Error))
      ).toBe(true);
      expect(
        !trans1.firstProcessed ||
          trans1.firstProcessed instanceof Error ||
          !trans2.firstProcessed ||
          trans2.firstProcessed instanceof Error
      ).toBe(true);
      const requests = await Request.findAll({
        where: { transactionId: "trans1" },
      });
      expect(requests.filter((r) => r.firstProcessed).length).toBe(1);
    });
  });
});

describe("rule management", () => {
  let UserId;
  beforeAll(async () => {
    const mockUser = {
      email: "user@mail.com",
      accessToken: "access123",
      refreshToken: "refresh123",
      monzoUserId: "monzouser123",
      password: "pass1234",
      monzoAccountId: "monzoaccount123",
    };
    const user = await User.create(mockUser);
    UserId = user.id;
  });
  afterAll(async () => {
    User.destroy({ truncate: true });
  });
  afterEach(async () => {
    Rule.destroy({ truncate: true });
  });

  describe("addRule", () => {
    it("Adds a rule without macros correctly", async () => {
      const ruleWithoutMacros = {
        name: "Rule1",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
      };
      await db.addRule(ruleWithoutMacros);
      const rule = await Rule.findOne();
      expect(rule).toEqual(expect.objectContaining(ruleWithoutMacros));
    });
    it("Adds macro defined with object", async () => {
      const ruleWithMacroObject = {
        name: "Rule1",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
        macros: [{ name: "macro1", tasks: [{ some: "tasks" }] }],
      };
      await db.addRule(ruleWithMacroObject);
      const rule = await Rule.findOne({ include: Macro });
      expect(rule.Macros.length).toBe(1);
      expect(rule.Macros[0]).toEqual(
        expect.objectContaining(ruleWithMacroObject.macros[0])
      );
    });
    it("Adds macro defined with primary key", async () => {
      const macro = await Macro.create({
        name: "macro2",
        tasks: [{ some: "tasks" }],
      });
      const ruleWithMacroPk = {
        name: "Rule1",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
        macros: [macro.id],
      };
      await db.addRule(ruleWithMacroPk);
      const rule = await Rule.findOne({ include: Macro });
      expect(rule.Macros.length).toBe(1);
      expect(rule.Macros[0]).toEqual(
        expect.objectContaining({
          name: "macro2",
          tasks: [{ some: "tasks" }],
        })
      );
    });
    it("Adds macro defined with instance", async () => {
      const macro = await Macro.create({
        name: "macro2",
        tasks: [{ some: "tasks" }],
      });
      const ruleWithMacroInstance = {
        name: "Rule1",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
        macros: [macro],
      };
      await db.addRule(ruleWithMacroInstance);
      const rule = await Rule.findOne({ include: Macro });
      expect(rule.Macros.length).toBe(1);
      expect(rule.Macros[0]).toEqual(
        expect.objectContaining({
          name: "macro2",
          tasks: [{ some: "tasks" }],
        })
      );
    });
    it("Adds a mix of all three macros", async () => {
      const macro1 = {
        name: "macro1",
      };
      const macro2 = await Macro.create({ name: "macro2" });
      const macro3 = await Macro.create({ name: "macro3" });
      const ruleWithMixedMacros = {
        name: "Rule1",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
        macros: [macro1, macro2, macro3.id],
      };
      await db.addRule(ruleWithMixedMacros);
      const rule = await Rule.findOne({ include: Macro });
      expect(rule.Macros.length).toBe(3);
      expect(rule.Macros.map(({ name }) => ({ name }))).toEqual([
        { name: "macro1" },
        { name: "macro2" },
        { name: "macro3" },
      ]);
    });
  });

  describe("getAllRules", () => {
    let UserId2;
    beforeAll(() => {
      const mockUser = {
        email: "user1@mail.com",
        accessToken: "access124",
        refreshToken: "refresh124",
        monzoUserId: "monzouser124",
        password: "pass1235",
        monzoAccountId: "monzoaccount124",
      };
      const user = User.create(mockUser);
      UserId2 = user.id;
    });
    beforeEach(async () => {
      const ruleWithoutMacros = {
        name: "Rule1",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
      };
      await db.addRule(ruleWithoutMacros);
      const macro2 = await Macro.create({
        name: "macro2",
        tasks: [{ some: "tasks" }],
      });
      const ruleWithMacroPk = {
        name: "Rule2",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId,
        macros: [macro2.id],
      };
      await db.addRule(ruleWithMacroPk);
      const macro3 = await Macro.create({
        name: "macro3",
        tasks: [{ some: "tasks" }],
      });
      const ruleWithMacroInstance = {
        name: "Rule3",
        filters: [{ type: "direction" }, { type: "amount" }],
        UserId: UserId2,
        macros: [macro3],
      };
      await db.addRule(ruleWithMacroInstance);
    });
    it("returns all rules for UserId", async () => {
      const rules = await db.getAllRules(UserId);
      expect(rules.map(({ name, filters }) => ({ name, filters }))).toEqual([
        { name: "Rule1", filters: [{ type: "direction" }, { type: "amount" }] },
        { name: "Rule2", filters: [{ type: "direction" }, { type: "amount" }] },
      ]);
    });
  });
});
