const fs = require("fs"), path = require("path"), crypto = require("crypto");
require(path.join(process.cwd(), "node_modules/dotenv")).config({path:path.join(process.cwd(), ".env")});
const {generateSignature}=require(path.join(process.cwd(), "utils/hmac"));
const payload={method:"POST",path:"/api/withdraw",user_id:"anis_101",account_id:"acc_777",amount:1000,currency:"BDT",timestamp:new Date().toISOString(),nonce:crypto.randomUUID(),request_id:crypto.randomUUID()};
payload.signature=generateSignature(payload,process.env.HMAC_SECRET);
fs.writeFileSync(path.resolve(process.cwd(),"../experiments/results/baseline/tamper-source.json"),JSON.stringify(payload,null,2)+"\n");