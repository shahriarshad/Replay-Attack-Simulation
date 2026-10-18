import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BalanceDisplay from './components/BalanceDisplay.jsx';
import WithdrawForm from './components/WithdrawForm.jsx';
import DepositForm from './components/DepositForm.jsx';
import TransactionHistory from './components/TransactionHistory.jsx';
import { getBalance, getTransactions, login } from './api.js';
import { socket } from './socket.js';
import './styles.css';

function App() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [lastPayload, setLastPayload] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState('anis_101');
  const [pin, setPin] = useState('');

  const refreshData = useCallback(async () => {
    const [balanceData, transactionData] = await Promise.all([
      getBalance(),
      getTransactions()
    ]);
    setBalance(balanceData);
    setTransactions(transactionData);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    refreshData().catch((error) => {
      setStatus(error.response?.data?.error || error.message);
    });
  }, [authenticated, refreshData]);

  async function handleLogin(event) {
    event.preventDefault();
    try {
      await login(userId, pin);
      setAuthenticated(true);
      setPin('');
      setStatus('Logged in');
    } catch (error) {
      setStatus(error.response?.data?.error || error.message);
    }
  }

  useEffect(() => {
    function handleReset() {
      setLastPayload(null);
      setStatus('Demo reset received');
      refreshData().catch((error) => {
        setStatus(error.response?.data?.error || error.message);
      });
    }

    socket.on('reset', handleReset);
    return () => {
      socket.off('reset', handleReset);
    };
  }, [refreshData]);

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Anis Ahmed</p>
          <h1>Bank Account</h1>
        </div>
        <div className="status">{status}</div>
      </section>

      {!authenticated ? (
        <form className="tool-panel" onSubmit={handleLogin}>
          <h2>Log in</h2>
          <label>
            User ID
            <input value={userId} onChange={(event) => setUserId(event.target.value)} required />
          </label>
          <label>
            PIN
            <input type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} required />
          </label>
          <button type="submit">Log in</button>
        </form>
      ) : (
        <>
          <BalanceDisplay balance={balance} />
          <section className="actions">
            <WithdrawForm onStatus={setStatus} onPayload={setLastPayload} onComplete={refreshData} />
            <DepositForm onStatus={setStatus} onComplete={refreshData} />
          </section>
        </>
      )}

      {lastPayload && (
        <section className="payload-panel">
          <h2>Last Withdraw Payload</h2>
          <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
        </section>
      )}

      <TransactionHistory transactions={transactions} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
