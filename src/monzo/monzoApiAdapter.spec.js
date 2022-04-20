import { jest } from "@jest/globals";
import createMonzoApiAdapter from "./monzoApiAdapter.js";
import crypto from "crypto";
import qs from "qs";

const monzoClient = {
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  put: jest.fn(),
};
const getMonzoClient = () => monzoClient;

const config = {
  get: jest
    .fn()
    .mockImplementation((property) =>
      property == "appUrl" ? "www.test.com" : "www.testimage.com"
    ),
};

const cryptoResult = crypto.randomBytes(16);
const mockCrypto = { randomBytes: jest.fn().mockReturnValue(cryptoResult) };

const monzo = createMonzoApiAdapter({
  getMonzoClient,
  config,
  crypto: mockCrypto,
  qs,
});

const mockUser = { monzoAccountId: "accountabc123" };

const callArgs = (func) => func.mock.calls[0];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("webhook management", () => {
  beforeEach(() => {
    monzoClient.get.mockImplementation(() => ({
      data: {
        webhooks: [{ account_id: "accountxyz789", url: "www.test.com/hook" }],
      },
    }));
  });
  describe("listWebhooks", () => {
    const { listWebhooks } = monzo;
    it("calls get with monzoAccountId", async () => {
      await listWebhooks(mockUser);
      expect(monzoClient.get).toHaveBeenCalled();
      expect(callArgs(monzoClient.get)[0]).toBe(
        `/webhooks?account_id=${mockUser.monzoAccountId}`
      );
    });
    it("returns webhooks", async () => {
      const webhooks = await listWebhooks(mockUser);
      expect(webhooks).toEqual([
        { account_id: "accountxyz789", url: "www.test.com/hook" },
      ]);
    });
    it("throws error if user is not passed", async () => {
      await expect(listWebhooks).rejects.toThrow();
    });
  });
  describe("registerWebHook", () => {
    const { registerWebHook } = monzo;
    it("does not create webhook if it already exists", async () => {
      await registerWebHook({ monzoAccountId: "accountxyz789" });
      expect(monzoClient.post).not.toHaveBeenCalled();
    });
    it("posts to webhooks", async () => {
      await registerWebHook(mockUser);
      expect(monzoClient.post).toHaveBeenCalled();
      expect(callArgs(monzoClient.post)[0]).toEqual("/webhooks");
    });
    it("posts with account_id and webhook url", async () => {
      await registerWebHook(mockUser);
      expect(callArgs(monzoClient.post)[1]).toEqual({
        account_id: mockUser.monzoAccountId,
        url: "www.test.com/hook",
      });
    });
    it("posts if existing webhook is for incorrect url", async () => {
      monzoClient.get.mockImplementation(() => ({
        data: {
          webhooks: [
            { account_id: "accountxyz789", url: "www.test.com/hookers" },
          ],
        },
      }));
      await registerWebHook({ monzoAccountId: "accountxyz789" });
      expect(monzoClient.post).toHaveBeenCalled();
    });
    it("throws an error if no user is passed", async () => {
      await expect(registerWebHook).rejects.toThrow();
    });
  });
});

describe("getAccounts", () => {
  const { getAccounts } = monzo;
  beforeEach(() => {
    monzoClient.get.mockImplementation(() => ({
      data: {
        accounts: [{ account_id: "accountxyz789" }],
      },
    }));
  });
  it("gets /accounts with account_type", async () => {
    await getAccounts(mockUser);
    expect(monzoClient.get).toHaveBeenCalled();
    expect(callArgs(monzoClient.get)[0]).toBe(
      "/accounts?account_type=uk_retail"
    );
  });
  it("returns accounts", async () => {
    const accounts = await getAccounts(mockUser);
    expect(accounts).toEqual([{ account_id: "accountxyz789" }]);
  });
});

describe("getPots", () => {
  const { getPots } = monzo;
  beforeEach(() => {
    monzoClient.get.mockImplementation(() => ({
      data: {
        pots: [{ pot_id: "accountxyz789" }],
      },
    }));
  });
  it("gets /accounts with account_type", async () => {
    await getPots(mockUser);
    expect(monzoClient.get).toHaveBeenCalled();
    expect(callArgs(monzoClient.get)[0]).toBe(
      "/pots?current_account_id=accountabc123"
    );
  });
  it("returns accounts", async () => {
    const accounts = await getPots(mockUser);
    expect(accounts).toEqual([{ pot_id: "accountxyz789" }]);
  });
});

describe("getPotBalance", () => {
  const { getPotBalance } = monzo;
  beforeEach(() => {
    monzoClient.get.mockImplementation((url) => ({
      data: url.includes("balance")
        ? { balance: 1500 }
        : {
            pots: [{ name: "Savings", pot_id: "accountxyz789", balance: 2000 }],
          },
    }));
  });
  it("gets /balance with monzoAccountId if pot is current", async () => {
    await getPotBalance(mockUser, "current");
    expect(monzoClient.get).toHaveBeenCalled();
    expect(callArgs(monzoClient.get)[0]).toBe(
      `/balance?account_id=accountabc123`
    );
  });
  it("gets /balance with monzoAccountId if pot is Current", async () => {
    await getPotBalance(mockUser, "Current");
    expect(monzoClient.get).toHaveBeenCalled();
    expect(callArgs(monzoClient.get)[0]).toBe(
      `/balance?account_id=accountabc123`
    );
  });
  it("returns balance for current", async () => {
    const balance = await getPotBalance(mockUser, "Current");
    expect(balance).toBe(1500);
  });
  it("gets /pots with monzoAccountId if pot is other", async () => {
    await getPotBalance(mockUser, "Savings");
    expect(monzoClient.get).toHaveBeenCalled();
    expect(callArgs(monzoClient.get)[0]).toBe(
      `/pots?current_account_id=accountabc123`
    );
  });
  it("returns balance if pot name is matched", async () => {
    const balance = await getPotBalance(mockUser, "Savings");
    expect(balance).toBe(2000);
  });
  it("throws an error if pot is not found", async () => {
    const runWithBadPot = () => getPotBalance(mockUser, "Badpot");
    expect(runWithBadPot).rejects.toThrow("Pot could not be found.");
  });
});

describe("withdraw", () => {
  const { withdraw } = monzo;
  beforeEach(() => {
    monzoClient.get.mockImplementation(() => ({
      data: {
        pots: [{ name: "Savings", id: "potabc123", balance: 2000 }],
      },
    }));
  });
  it("puts to /pots/potid/withdraw", async () => {
    await withdraw(mockUser, "Savings", 150, "deduped");
    expect(monzoClient.put).toHaveBeenCalled();
    expect(callArgs(monzoClient.put)[0]).toBe("/pots/potabc123/withdraw");
  });
  it("passes params in put", async () => {
    await withdraw(mockUser, "Savings", 150, "deduped");
    const params = {
      destination_account_id: mockUser.monzoAccountId,
      source_account_id: mockUser.monzoAccountId,
      amount: 150,
      dedupe_id: "deduped",
    };
    expect(callArgs(monzoClient.put)[1]).toEqual(params);
  });
  it("created dedupe ID if none is provided", async () => {
    await withdraw(mockUser, "Savings", 150);
    expect(callArgs(monzoClient.put)[1].dedupe_id).toBe(
      cryptoResult.toString("hex")
    );
  });
  it("throws error if pot is not found", async () => {
    const runWithBadPot = () => withdraw(mockUser, "Badpot", 150);
    expect(runWithBadPot).rejects.toThrow("Pot could not be found.");
  });
});

describe("deposit", () => {
  const { deposit } = monzo;
  beforeEach(() => {
    monzoClient.get.mockImplementation(() => ({
      data: {
        pots: [{ name: "Savings", id: "potabc123", balance: 2000 }],
      },
    }));
  });
  it("puts to /pots/potid/deposit", async () => {
    await deposit(mockUser, "Savings", 150, "deduped");
    expect(monzoClient.put).toHaveBeenCalled();
    expect(callArgs(monzoClient.put)[0]).toBe("/pots/potabc123/deposit");
  });
  it("passes params in put", async () => {
    await deposit(mockUser, "Savings", 150, "deduped");
    const params = {
      destination_account_id: mockUser.monzoAccountId,
      source_account_id: mockUser.monzoAccountId,
      amount: 150,
      dedupe_id: "deduped",
    };
    expect(callArgs(monzoClient.put)[1]).toEqual(params);
  });
  it("created dedupe ID if none is provided", async () => {
    await deposit(mockUser, "Savings", 150);
    expect(callArgs(monzoClient.put)[1].dedupe_id).toBe(
      cryptoResult.toString("hex")
    );
  });
  it("throws error if pot is not found", async () => {
    const runWithBadPot = () => deposit(mockUser, "Badpot", 150);
    expect(runWithBadPot).rejects.toThrow("Pot could not be found.");
  });
});

describe("getTransactions", () => {
  const { getTransactions } = monzo;
  beforeEach(() => {
    monzoClient.get.mockImplementation(() => ({
      data: {
        transactions: {
          id: 5,
        },
      },
    }));
  });
  it("gets from /transactions", async () => {
    await getTransactions(mockUser);
    expect(monzoClient.get).toHaveBeenCalled();
    expect(callArgs(monzoClient.get)[0]).toBe("/transactions");
  });
  it("passes monzoAccountId in params", async () => {
    await getTransactions(mockUser);
    expect(callArgs(monzoClient.get)[1].params.account_id).toBe(
      mockUser.monzoAccountId
    );
  });
  it("passes undefined for since and before if not passed", async () => {
    await getTransactions(mockUser);
    expect(callArgs(monzoClient.get)[1].params.since).toBeUndefined();
    expect(callArgs(monzoClient.get)[1].params.before).toBeUndefined();
  });
  it("formats from and to and passes", async () => {
    const from = new Date(2020, 10, 23);
    const to = new Date(2021, 1, 20);
    const since = new Date(from).toISOString();
    const before = new Date(to).toISOString();
    await getTransactions(mockUser, from, to);
    expect(callArgs(monzoClient.get)[1].params.since).toBe(since);
    expect(callArgs(monzoClient.get)[1].params.before).toBe(before);
  });
});

describe("notify", () => {
  const { notify } = monzo;
  it("posts to /feed", async () => {
    await notify(mockUser);
    expect(monzoClient.post).toHaveBeenCalled();
    expect(callArgs(monzoClient.post)[0]).toBe("/feed");
  });
  it("passes monzoAccountId", async () => {
    await notify(mockUser);
    expect(callArgs(monzoClient.post)[1].account_id).toBe(
      mockUser.monzoAccountId
    );
  });
  it("passes type: basic", async () => {
    await notify(mockUser);
    expect(callArgs(monzoClient.post)[1].type).toBe("basic");
  });
  it("passes title, body and url", async () => {
    await notify(mockUser, "Mock Title", "Mock body", "www.mock.com");
    expect(callArgs(monzoClient.post)[1].params.title).toBe("Mock Title");
    expect(callArgs(monzoClient.post)[1].params.body).toBe("Mock body");
    expect(callArgs(monzoClient.post)[1].url).toBe("www.mock.com");
  });
  it("passes deault image_url if none given", async () => {
    await notify(mockUser, "Mock Title", "Mock body", "www.mock.com");
    expect(callArgs(monzoClient.post)[1].params.image_url).toBe(
      "www.testimage.com"
    );
  });
  it("passes image_url if given", async () => {
    await notify(
      mockUser,
      "Mock Title",
      "Mock body",
      "www.mock.com",
      "www.otherimage.com"
    );
    expect(callArgs(monzoClient.post)[1].params.image_url).toBe(
      "www.otherimage.com"
    );
  });
});
