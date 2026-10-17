const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const crypto = require("crypto");
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const outDir = path.resolve(process.cwd(), "../experiments/results/baseline");
const base = () => ({ method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1, currency: "BDT", timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() });
const sign = payload => { payload.signature = generateSignature(payload, process.env.HMAC_SECRET); return payload; };
const post = async payload => { const start = process.hrtime.bigint(); const response = await fetch("http://127.0.0.1:3000/api/withdraw", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); const end = process.hrtime.bigint(); return { started_ns: start.toString(), ended_ns: end.toString(), duration_ns: (end-start).toString(), httpStatus: response.status, ...body }; };
const key = result => result.status === "ACCEPTED" ? "ACCEPTED" : (result.reason || result.error || "UNKNOWN");
(async () => {
  const parallelPayload = sign(base());
  const parallel = await Promise.all(Array.from({ length: 50 }, () => post(parallelPayload)));
  const parallelCounts = parallel.reduce((acc, result) => { const k = key(result); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  fs.writeFileSync(path.join(outDir, "parallel-50-responses.json"), JSON.stringify(parallel, null, 2) + "\n");
  const changedIdPayload = sign(base());
  changedIdPayload.request_id = crypto.randomUUID();
  const changedId = await post(changedIdPayload);
  const skew = [];
  for (const [label, offsetMs] of [["-10m", -600000], ["-1m", -60000], ["+10s", 10000], ["+1m", 60000], ["+10m", 600000]]) {
    const payload = sign(base());
    payload.timestamp = new Date(Date.now() + offsetMs).toISOString();
    payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
    skew.push({ label, offsetMs, result: await post(payload) });
  }
  const resetStart = process.hrtime.bigint();
  const resetResponse = await fetch("http://127.0.0.1:3000/api/reset", { method: "POST" });
  const resetEnd = process.hrtime.bigint();
  const resetTiming = { started_ns: resetStart.toString(), ended_ns: resetEnd.toString(), duration_ns: (resetEnd-resetStart).toString(), httpStatus: resetResponse.status };
  const seed = sign(base());
  const seedResult = await post(seed);
  const crashStart = process.hrtime.bigint();
  const crashResponse = await fetch("http://127.0.0.1:3000/api/demo/nonce-crash", { method: "POST" });
  const nonceCrash = await crashResponse.json();
  const crashEnd = process.hrtime.bigint();
  nonceCrash.timing = { started_ns: crashStart.toString(), ended_ns: crashEnd.toString(), duration_ns: (crashEnd-crashStart).toString(), httpStatus: crashResponse.status };
  const duplicateId = seed.request_id;
  const rows = ["index,started_ns,ended_ns,duration_ns,httpStatus,status,reason"];
  const counts = {};
  for (let i = 1; i <= 10000; i++) {
    const payload = sign({ ...base(), request_id: duplicateId });
    const result = await post(payload);
    const k = key(result); counts[k] = (counts[k] || 0) + 1;
    rows.push([i, result.started_ns, result.ended_ns, result.duration_ns, result.httpStatus, result.status || "", result.reason || ""].join(","));
  }
  fs.writeFileSync(path.join(outDir, "unique-nonce-10000-responses.csv"), rows.join("\n") + "\n");
  const result = { parallel50: { total: parallel.length, counts: parallelCounts, perRequestTiming: parallel.map(({ started_ns, ended_ns, duration_ns }) => ({ started_ns, ended_ns, duration_ns })) }, changedRequestIdWithOldSignature: changedId, clockSkew: skew, controlRequests: { reset: resetTiming }, nonceGrowth: { resetPerformed: true, seedResult, nonceStoreClearedBeforeLoop: nonceCrash, requests: 10000, uniqueNonces: 10000, reusedRequestId: duplicateId, responseCounts: counts } };
  fs.writeFileSync(path.join(outDir, "measured-cases.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
