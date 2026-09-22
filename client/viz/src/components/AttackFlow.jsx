import React from 'react';

export default function AttackFlow({ lastRequest, lastResult }) {
  const source = lastRequest?.user === 'anis_101' ? 'Anis' : 'Eve';
  const requestText = lastRequest
    ? `${source} ${lastRequest.type} ${lastRequest.amount}`
    : 'Waiting for traffic';

  return (
    <section className="flow-band">
      <div className="actor anis">Anis</div>
      <div className="lane">
        <span className={lastRequest ? 'packet active' : 'packet'}>{requestText}</span>
      </div>
      <div className="server-node">Server</div>
      <div className="lane reverse">
        <span className={lastResult ? 'packet active' : 'packet'}>
          {lastResult ? lastResult.status : 'No result'}
        </span>
      </div>
      <div className="actor eve">Eve</div>
      <div className="storage redis">Redis</div>
      <div className="storage sqlite">SQLite</div>
    </section>
  );
}
