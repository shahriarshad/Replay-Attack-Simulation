import React from 'react';

export default function TransactionHistory({ transactions }) {
  return (
    <section className="history">
      <h2>Transaction History</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6">No transactions yet.</td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.request_id}</td>
                  <td>{transaction.type}</td>
                  <td>{transaction.amount} {transaction.currency}</td>
                  <td>{transaction.status}</td>
                  <td>{transaction.reason || '-'}</td>
                  <td>{transaction.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
