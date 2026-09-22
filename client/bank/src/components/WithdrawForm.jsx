import React, { useState } from 'react';
import { withdraw } from '../api.js';

export default function WithdrawForm({ onStatus, onPayload, onComplete }) {
  const [amount, setAmount] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    onStatus('Submitting withdraw');

    try {
      const result = await withdraw(amount);
      onPayload(result.payload);
      onStatus(`Withdraw accepted. New balance: ${result.data.newBalance} BDT`);
      await onComplete();
    } catch (error) {
      onStatus(error.response?.data?.reason || error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="tool-panel" onSubmit={handleSubmit}>
      <h2>Withdraw</h2>
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
        {submitting ? 'Processing' : 'Withdraw'}
      </button>
    </form>
  );
}
