import React, { useState } from 'react';
import { deposit } from '../api.js';

export default function DepositForm({ onStatus, onComplete }) {
  const [amount, setAmount] = useState('500');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    onStatus('Submitting deposit');

    try {
      const result = await deposit(amount);
      onStatus(`Deposit accepted. New balance: ${result.newBalance} BDT`);
      await onComplete();
    } catch (error) {
      onStatus(error.response?.data?.reason || error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="tool-panel" onSubmit={handleSubmit}>
      <h2>Deposit</h2>
      <label>
        Amount
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Processing' : 'Deposit'}
      </button>
    </form>
  );
}
