function getTransactionByRequestId(db, requestId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM transactions WHERE request_id = ?', //query to find a transaction by request_id
      [requestId],
      (error, row) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(row || null); // resolve with the found row or null if not found
      }
    );
  });
}

async function isRequestProcessed(db, requestId) {
  const row = await new Promise((resolve, reject) => {
    db.get("SELECT * FROM transactions WHERE request_id = ? AND status = 'SUCCESS' LIMIT 1", [requestId], (error, result) => {
      if (error) return reject(error);
      resolve(result || null);
    });
  });
  return {
    processed: Boolean(row),
    row
  };
}

module.exports = {
  getTransactionByRequestId,
  isRequestProcessed
};
