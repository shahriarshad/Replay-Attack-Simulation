import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AttackFlow from './components/AttackFlow.jsx';
import ServerChecks from './components/ServerChecks.jsx';
import AttackLog from './components/AttackLog.jsx';
import DatabaseState from './components/DatabaseState.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import { registerSocketListeners, socket } from './socket.js';
import './styles.css';

const initialChecks = {
  signature: { label: 'HMAC Signature', status: 'WAITING', detail: 'No request yet' },
  timestamp: { label: 'Timestamp', status: 'WAITING', detail: 'No request yet' },
  nonce: { label: 'Nonce', status: 'WAITING', detail: 'No request yet' },
  requestid: { label: 'Request ID', status: 'WAITING', detail: 'No request yet' },
  balance: { label: 'Balance', status: 'WAITING', detail: 'No request yet' }
};

function timestamp() {
  return new Date().toLocaleTimeString();
}

function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [checks, setChecks] = useState(initialChecks);
  const [logs, setLogs] = useState([]);
  const [dbState, setDbState] = useState({ accounts: [], transactions: [] });
  const [redisKeys, setRedisKeys] = useState([]);
  const [nonceCrashActive, setNonceCrashActive] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    blocked: 0
  });

  function addLog(message, type = 'info') {
    setLogs((current) => [
      { id: `${Date.now()}_${Math.random()}`, time: timestamp(), message, type },
      ...current
    ].slice(0, 80));
  }

  function resetLocalState(data = { accounts: [], transactions: [], keys: [] }) {
    setChecks(initialChecks);
    setLogs([]);
    setDbState({
      accounts: data.accounts || [],
      transactions: data.transactions || []
    });
    setRedisKeys(data.keys || []);
    setLastRequest(null);
    setLastResult(null);
    setStats({
      total: 0,
      accepted: 0,
      rejected: 0,
      blocked: 0
    });
    setNonceCrashActive(false);
  }

  async function handleResetDemo() {
    const response = await fetch('http://localhost:3000/api/reset', {
      method: 'POST'
    });
    const data = await response.json();
    resetLocalState(data);
  }

  async function handleNonceCrashToggle() {
    if (nonceCrashActive) {
      setNonceCrashActive(false);
      return;
    }

    const response = await fetch('http://localhost:3000/api/demo/nonce-crash', {
      method: 'POST'
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      addLog('NONCE SERVER CRASH SIMULATION FAILED', 'reject');
      return;
    }

    setNonceCrashActive(true);
    const noun = data.deleted === 1 ? 'nonce key' : 'nonce keys';
    addLog(`NONCE SERVER CRASH SIMULATION: ${data.deleted} ${noun} cleared`, 'reject');
  }

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      addLog('Dashboard connected to ws://localhost:3001', 'success');
    };
    const handleDisconnect = () => {
      setConnected(false);
      addLog('Dashboard disconnected from ws://localhost:3001', 'reject');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  useEffect(() => {
    return registerSocketListeners({
      onRequestReceived(data) {
        setLastRequest(data);
        setLastResult(null);
        setChecks(initialChecks);
        if (data.type !== 'CONNECTED') {
          setStats((current) => ({ ...current, total: current.total + 1 }));
        }
        addLog(`${data.user} -> ${data.type} ${data.amount}`, 'request');
      },
      onCheckSignature(data) {
        setChecks((current) => ({
          ...current,
          signature: {
            label: 'HMAC Signature',
            status: data.status,
            detail: `received ${String(data.received).slice(0, 14)}...`
          }
        }));
        addLog(`Signature ${data.status}`, data.status === 'PASS' ? 'success' : 'reject');
      },
      onCheckTimestamp(data) {
        setChecks((current) => ({
          ...current,
          timestamp: {
            label: 'Timestamp',
            status: data.status,
            detail: `${data.diff}s / ${data.allowed}s`
          }
        }));
        addLog(`Timestamp ${data.status} (${data.diff}s)`, data.status === 'PASS' ? 'success' : 'reject');
      },
      onCheckNonce(data) {
        setChecks((current) => ({
          ...current,
          nonce: {
            label: 'Nonce',
            status: data.status,
            detail: `${data.nonce} ${data.redisResult}`
          }
        }));
        addLog(`Nonce ${data.status} (${data.redisResult})`, data.status === 'PASS' ? 'success' : 'reject');
      },
      onCheckRequestId(data) {
        setChecks((current) => ({
          ...current,
          requestid: {
            label: 'Request ID',
            status: data.status,
            detail: `${data.requestId} found=${data.found}`
          }
        }));
        addLog(`Request ID ${data.status}`, data.status === 'PASS' ? 'success' : 'reject');
      },
      onCheckBalance(data) {
        setChecks((current) => ({
          ...current,
          balance: {
            label: 'Balance',
            status: data.status,
            detail: `${data.balance} >= ${data.required}`
          }
        }));
        addLog(`Balance ${data.status}`, data.status === 'PASS' ? 'success' : 'reject');
      },
      onTransactionResult(data) {
        setLastResult(data);
        setStats((current) => ({
          total: current.total,
          accepted: current.accepted + (data.status === 'ACCEPTED' ? 1 : 0),
          rejected: current.rejected + (data.status === 'REJECTED' ? 1 : 0),
          blocked: current.blocked + (data.reason ? 1 : 0)
        }));
        addLog(`Result ${data.status}${data.reason ? `: ${data.reason}` : ''}`, data.status === 'ACCEPTED' ? 'success' : 'reject');
      },
      onDbUpdate(data) {
        setDbState(data);
        addLog('SQLite db-update received', 'data');
      },
      onRedisUpdate(data) {
        setRedisKeys(data.keys);
        addLog(`Redis keys: ${data.keys.length}`, 'data');
      },
      onReset(data) {
        resetLocalState(data);
      }
    });
  }, []);

  const anisAccount = useMemo(
    () => dbState.accounts.find((account) => account.user_id === 'anis_101'),
    [dbState.accounts]
  );

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">Bank Server Visualizer</p>
          <h1>Replay Attack Defense</h1>
        </div>
        <div className="header-actions">
          <button
            className={nonceCrashActive ? 'nonce-crash-button active' : 'nonce-crash-button'}
            type="button"
            aria-pressed={nonceCrashActive}
            onClick={handleNonceCrashToggle}
          >
            {nonceCrashActive ? 'NONCE SERVER CRASH: ON' : 'NONCE SERVER CRASH'}
          </button>
          <button className="reset-button" type="button" onClick={handleResetDemo}>
            RESET DEMO
          </button>
          <span className={connected ? 'live connected' : 'live'}>{connected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </header>

      <AttackFlow lastRequest={lastRequest} lastResult={lastResult} />
      <StatsPanel stats={stats} balance={anisAccount?.balance} redisCount={redisKeys.length} />

      <section className="main-grid">
        <ServerChecks checks={checks} result={lastResult} />
        <AttackLog logs={logs} />
      </section>

      <DatabaseState dbState={dbState} redisKeys={redisKeys} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
