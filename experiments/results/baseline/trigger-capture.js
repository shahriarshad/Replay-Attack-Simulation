const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const crypto = require("crypto");
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const payload = { method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1000, currency: "BDT", timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() };
payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
const started = process.hrtime.bigint();
fetch("http://127.0.0.1:3000/api/withdraw", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then(async response => {
  const body = await response.json();
  const ended = process.hrtime.bigint();
  const result = { started_ns: started.toString(), ended_ns: ended.toString(), duration_ns: (ended-started).toString(), httpStatus: response.status, body };
  fs.writeFileSync(path.resolve(process.cwd(), "../experiments/results/baseline/immediate-replay-trigger.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
}).catch(error => { console.error(error.message); process.exitCode = 1; });
