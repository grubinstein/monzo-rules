import { addTestRules } from "./testRules.js";
import { registerWebHook } from "./src/monzo/monzoClient.js";
import app from "./src/app.js";

app.listen(3000, () => {
  console.log("App listening on port 3000");
});

await registerWebHook();

if (process.env.NODE_ENV == "development") {
  addTestRules();
}
