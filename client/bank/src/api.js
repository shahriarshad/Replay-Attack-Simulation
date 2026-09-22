import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const HMAC_SECRET = import.meta.env.VITE_HMAC_SECRET || 'demo_shared_hmac_secret_change_me';
const USER_ID = 'anis_101';
const ACCOUNT_ID = 'acc_777';
const CURRENCY = 'BDT';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(prefix) {
  const values = new Uint32Array(3);
  window.crypto.getRandomValues(values);
  return `${prefix}_${Array.from(values).map((value) => value.toString(16)).join('')}`;
}

export function buildHmacMessage(payload) {
  return [
    payload.method,
    payload.path,
    payload.user_id,
    payload.account_id,
    payload.amount,
    payload.currency,
    payload.timestamp,
    payload.nonce,
    payload.request_id
  ].join('|');
}

export async function signPayload(payload) {
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(buildHmacMessage(payload))
  );
  return bytesToHex(signature);
}

export async function createSignedWithdrawPayload(amount) {
  const payload = {
    method: 'POST',
    path: '/api/withdraw',
    user_id: USER_ID,
    account_id: ACCOUNT_ID,
    amount: Number(amount),
    currency: CURRENCY,
    timestamp: new Date().toISOString(),
    nonce: randomToken('nonce'),
    request_id: randomToken('wd')
  };

  payload.signature = await signPayload(payload);
  return payload;
}

export async function getBalance() {
  const response = await api.get(`/api/balance/${USER_ID}`);
  return response.data;
}

export async function getTransactions() {
  const response = await api.get(`/api/transactions/${USER_ID}`);
  return response.data.transactions;
}

export async function withdraw(amount) {
  const payload = await createSignedWithdrawPayload(amount);
  const response = await api.post('/api/withdraw', payload);
  return {
    data: response.data,
    payload
  };
}

export async function deposit(amount) {
  const response = await api.post('/api/deposit', {
    user_id: USER_ID,
    account_id: ACCOUNT_ID,
    amount: Number(amount),
    currency: CURRENCY,
    request_id: randomToken('dep')
  });
  return response.data;
}
