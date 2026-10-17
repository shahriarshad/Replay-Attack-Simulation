async function timedRequest(url, options = {}) {
  const start = process.hrtime.bigint();
  const response = await fetch(url, options);
  const text = await response.text();
  const end = process.hrtime.bigint();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return {
    start_ns: start.toString(),
    end_ns: end.toString(),
    duration_ns: (end - start).toString(),
    status: response.status,
    body
  };
}

module.exports = { timedRequest };
