import React from 'react';

export default function DatabaseState({ dbState, redisKeys }) {
  const anis = dbState.accounts.find((account) => account.user_id === 'anis_101');

  return (
    <section className="panel database">
      <h2>Database State</h2>
      <div className="db-summary">
        <div>
          <span>Anis Balance</span>
          <strong>{anis ? `${anis.balance} ${anis.currency}` : 'Loading'}</strong>
        </div>
        <div>
          <span>Redis Keys</span>
          <strong>{redisKeys.length}</strong>
        </div>
        <div>
          <span>Transactions</span>
          <strong>{dbState.transactions.length}</strong>
        </div>
      </div>

      <div className="redis-list">
        {redisKeys.length === 0 ? 'No nonce keys currently visible.' : redisKeys.join(', ')}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {dbState.transactions.length === 0 ? (
              <tr>
                <td colSpan="5">No transactions yet.</td>
              </tr>
            ) : (
              dbState.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.request_id}</td>
                  <td>{transaction.type}</td>
                  <td>{transaction.amount} {transaction.currency}</td>
                  <td>{transaction.status}</td>
                  <td>{transaction.reason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
