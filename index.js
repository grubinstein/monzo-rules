import https from "https";
import fs from "fs";
import { addDevRules } from "./devRules.js";
import app from "./src/app.js";

app.listen(3000, () => {
  console.log("http server listening on port 3000");
});

https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  )
  .listen(8000, () => {
    console.log("https server listening on port 8000");
  });

if (process.env.NODE_ENV == "development") {
  //addDevRules();
}
