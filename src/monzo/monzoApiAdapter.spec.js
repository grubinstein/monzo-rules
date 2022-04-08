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
      property == "appUrl" ? "www.test.com" : undefined
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

const mockUser = { accountId: "accountabc123" };

const callArgs = (func) => func.mock.calls[0];

describe("webhook management", () => {
  monzoClient.get.mockImplementation(() => ({
    data: {
      webhooks: [{ account_id: "accountxyz789", url: "www.test.com/hook" }],
    },
  }));
  describe("listWebhooks", () => {
    const { listWebhooks } = monzo;
    it("calls get with accountId", async () => {
      await listWebhooks(mockUser);
      expect(monzoClient.get).toHaveBeenCalled();
      expect(callArgs(monzoClient.get)[0]).toBe(
        `/webhooks?account_id=${mockUser.accountId}`
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
      await registerWebHook({ accountId: "accountxyz789" });
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
        account_id: mockUser.accountId,
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
      await registerWebHook({ accountId: "accountxyz789" });
      expect(monzoClient.post).toHaveBeenCalled();
    });
    it("throws an error if no user is passed", async () => {
      await expect(registerWebHook).rejects.toThrow();
    });
  });
});
