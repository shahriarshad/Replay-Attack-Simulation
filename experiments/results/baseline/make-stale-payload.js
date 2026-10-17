const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const crypto = require("crypto");
const payload = { method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1000, currency: "BDT", timestamp: new Date(Date.now() - 301000).toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() };
payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
require("fs").writeFileSync(path.resolve(process.cwd(), "../experiments/results/baseline/stale-payload.json"), JSON.stringify(payload, null, 2) + "\n");