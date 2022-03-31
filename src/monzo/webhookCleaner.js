import {
  listWebhooks,
  removeUnnecessaryWebhooks,
} from "./src/monzo/monzoDriver.js";

await removeUnnecessaryWebhooks();

await listWebhooks();
