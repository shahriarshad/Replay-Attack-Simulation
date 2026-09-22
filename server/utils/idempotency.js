function getTransactionByRequestId(db, requestId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM transactions WHERE request_id = ?',
      [requestId],
      (error, row) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(row || null);
      }
    );
  });
}

async function isRequestProcessed(db, requestId) {
  const row = await getTransactionByRequestId(db, requestId);
  return {
    processed: Boolean(row),
    row
  };
}

module.exports = {
  getTransactionByRequestId,
  isRequestProcessed
};
