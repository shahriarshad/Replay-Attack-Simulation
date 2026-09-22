import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BalanceDisplay from './components/BalanceDisplay.jsx';
import WithdrawForm from './components/WithdrawForm.jsx';
import DepositForm from './components/DepositForm.jsx';
import TransactionHistory from './components/TransactionHistory.jsx';
import { getBalance, getTransactions } from './api.js';
import { socket } from './socket.js';
import './styles.css';

function App() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [lastPayload, setLastPayload] = useState(null);

  const refreshData = useCallback(async () => {
    const [balanceData, transactionData] = await Promise.all([
      getBalance(),
      getTransactions()
    ]);
    setBalance(balanceData);
    setTransactions(transactionData);
  }, []);

  useEffect(() => {
    refreshData().catch((error) => {
      setStatus(error.response?.data?.error || error.message);
    });
  }, [refreshData]);

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

      <BalanceDisplay balance={balance} />

      <section className="actions">
        <WithdrawForm
          onStatus={setStatus}
          onPayload={setLastPayload}
          onComplete={refreshData}
        />
        <DepositForm onStatus={setStatus} onComplete={refreshData} />
      </section>

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
