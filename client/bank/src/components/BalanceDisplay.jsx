import React from 'react';

export default function BalanceDisplay({ balance }) {
  return (
    <section className="balance-band">
      <div>
        <p className="eyebrow">Current Balance</p>
        <div className="balance-value">
          {balance ? `${balance.balance.toLocaleString()} ${balance.currency}` : 'Loading'}
        </div>
      </div>
      <div className="account-card">
        <span>Account</span>
        <strong>{balance?.user_id || 'anis_101'}</strong>
        <small>{balance?.username || 'Anis Ahmed'}</small>
      </div>
    </section>
  );
}
