import React from 'react';

export default function StatsPanel({ stats, balance, redisCount }) {
  return (
    <section className="stats-grid">
      <div>
        <span>Total Requests</span>
        <strong>{stats.total}</strong>
      </div>
      <div>
        <span>Accepted</span>
        <strong>{stats.accepted}</strong>
      </div>
      <div>
        <span>Rejected</span>
        <strong>{stats.rejected}</strong>
      </div>
      <div>
        <span>Attack Blocks</span>
        <strong>{stats.blocked}</strong>
      </div>
      <div>
        <span>Balance</span>
        <strong>{balance ?? '...'}</strong>
      </div>
      <div>
        <span>Redis Nonces</span>
        <strong>{redisCount}</strong>
      </div>
    </section>
  );
}
