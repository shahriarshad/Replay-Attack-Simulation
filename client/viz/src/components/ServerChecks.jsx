import React from 'react';

export default function ServerChecks({ checks, result }) {
  return (
    <section className="panel">
      <h2>Step-by-Step Checks</h2>
      <div className="checks">
        {Object.entries(checks).map(([key, check]) => (
          <div className="check-row" key={key}>
            <span className={`badge ${check.status.toLowerCase()}`}>{check.status}</span>
            <div>
              <strong>{check.label}</strong>
              <p>{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={`result ${result?.status === 'ACCEPTED' ? 'accepted' : result ? 'rejected' : ''}`}>
        {result ? (
          <>
            <strong>{result.status}</strong>
            <span>{result.reason || `Balance: ${result.newBalance}`}</span>
          </>
        ) : (
          <span>Waiting for final decision</span>
        )}
      </div>
    </section>
  );
}
