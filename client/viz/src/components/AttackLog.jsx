import React from 'react';

export default function AttackLog({ logs }) {
  return (
    <section className="panel">
      <h2>Attack Log</h2>
      <div className="log-list">
        {logs.length === 0 ? (
          <p className="empty">No events yet.</p>
        ) : (
          logs.map((log) => (
            <div className={`log-entry ${log.type}`} key={log.id}>
              <span>{log.time}</span>
              <p>{log.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
