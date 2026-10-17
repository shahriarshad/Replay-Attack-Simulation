const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { execFileSync } = require("child_process");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const outDir = path.resolve(process.cwd(), "../experiments/results");
const cli = "C:/Applications/memurai-cli.exe";
const info = execFileSync(cli, ["INFO", "server"], { encoding: "utf8" });
const mem = execFileSync(cli, ["INFO", "memory"], { encoding: "utf8" });
const scan = execFileSync(cli, ["--scan", "--pattern", "used_nonce:*"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const parse = text => Object.fromEntries(text.split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes(":" )).map(line => { const i=line.indexOf(":"); return [line.slice(0,i),line.slice(i+1)]; }));
const probe = port => new Promise(resolve => { const socket = net.createConnection({ host: "127.0.0.1", port }); socket.once("connect", () => { socket.destroy(); resolve(true); }); socket.once("error", () => resolve(false)); });
(async () => {
  const dbVersion = await new Promise((resolve, reject) => { const sqlite3 = require(path.join(process.cwd(), "node_modules/sqlite3")); const db = new sqlite3.Database(":memory:", error => { if (error) return reject(error); db.get("SELECT sqlite_version() AS version", (queryError,row) => { db.close(); queryError ? reject(queryError) : resolve(row.version); }); }); });
  const ports = { "3000": await probe(3000), "3001": await probe(3001), "6379": await probe(6379) };
  const redis = parse(info), memory = parse(mem);
  const result = {
    capturedAt: new Date().toISOString(),
    host: { os: `${os.platform()} ${os.release()}`, osVersion: os.version(), cpuModel: os.cpus()[0]?.model || "unknown", logicalCpuCount: os.cpus().length, totalRamBytes: os.totalmem(), totalRamGiB: Number((os.totalmem()/1024**3).toFixed(2)) },
    runtime: { node: process.version, sqlite3NodePackage: require(path.join(process.cwd(), "node_modules/sqlite3/package.json")).version, sqliteLibrary: dbVersion },
    nonceBackend: { product: "Memurai Developer (not stock Redis)", memuraiVersion: redis.memurai_version, edition: redis.memurai_edition, redisProtocolVersion: redis.redis_version, bind: redis.listener0, usedNonceKeys: scan.split(/\r?\n/).filter(Boolean).length, usedMemoryBytes: Number(memory.used_memory), usedMemoryHuman: memory.used_memory_human },
    portsReachableFromNativeNode: ports,
    apiHealth: await (async()=>{ try { const start=process.hrtime.bigint(); const response=await fetch("http://127.0.0.1:3000/api/health"); const body=await response.text(); const end=process.hrtime.bigint(); return { status: response.status, body, started_ns:start.toString(), ended_ns:end.toString(), duration_ns:(end-start).toString() }; } catch(error) { return { error: error.message }; } })(),
    redisUrl: process.env.REDIS_URL
  };
  fs.writeFileSync(path.join(outDir, "environment.json"), JSON.stringify(result, null, 2)+"\n");
  fs.writeFileSync(path.join(outDir, "baseline/nonce-growth-measured.json"), JSON.stringify({ capturedAt: result.capturedAt, usedNonceKeys: result.nonceBackend.usedNonceKeys, usedMemoryBytes: result.nonceBackend.usedMemoryBytes, usedMemoryHuman: result.nonceBackend.usedMemoryHuman, memuraiVersion: result.nonceBackend.memuraiVersion, nonceTtlSeconds: 300, requestsWithUniqueNonces: 10000 }, null, 2)+"\n");
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
