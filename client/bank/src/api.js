import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const USER_ID = 'anis_101';
const ACCOUNT_ID = 'acc_777';
const CURRENCY = 'BDT';
let session = null;

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
// random token for nonce and request_id to prevent replay attacks
function randomToken(prefix) {
  const values = new Uint32Array(3);
  window.crypto.getRandomValues(values);
  return `${prefix}_${Array.from(values).map((value) => value.toString(16)).join('')}`;
}

// 9 IMPORTANT DATA OF REQUEST BODY TO BE SIGNED IN HMAC MESSAGE
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
  ].join('|'); // using pipe '|' as a separator for the HMAC message
}

// Hashing Logic to sign the payload using HMAC-SHA256
export async function signPayload(payload) {
  if (!session?.sessionKey) throw new Error('Please log in before signing a transaction');
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(session.sessionKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(buildHmacMessage(payload))
  );
  return bytesToHex(signature); // This Signature will be sent to the server for verification of the request
}

export async function login(userId, pin) {
  const response = await api.post('/api/login', { user_id: userId || USER_ID, pin });
  session = response.data;
  api.defaults.headers.common.Authorization = `Bearer ${session.sessionToken}`;
  return session.user_id;
}

export function logout() {
  session = null;
  delete api.defaults.headers.common.Authorization;
}

export function currentUserId() {
  return session?.user_id || USER_ID;
}

export async function createSignedWithdrawPayload(amount) {
  const payload = {
    method: 'POST',
    path: '/api/withdraw',
    user_id: USER_ID,
    account_id: ACCOUNT_ID,
    amount: Number(amount),
    currency: CURRENCY,
    timestamp: new Date().toISOString(), // time added to the payload to prevent replay attacks
    nonce: randomToken('nonce'),  // nonce added to the payload to prevent replay attacks
    request_id: randomToken('wd') // request_id added to the payload to prevent replay attacks
  };

  payload.signature = await signPayload(payload);
  return payload;
}

export async function createSignedDepositPayload(amount) {
  const payload = {
    method: 'POST',
    path: '/api/deposit',
    user_id: currentUserId(),
    account_id: ACCOUNT_ID,
    amount: Number(amount),
    currency: CURRENCY,
    timestamp: new Date().toISOString(),
    nonce: randomToken('nonce'),
    request_id: randomToken('dep')
  };
  payload.signature = await signPayload(payload);
  return payload;
}

export async function getBalance() {
  const response = await api.get(`/api/balance/${currentUserId()}`);
  return response.data;
}

export async function getTransactions() {
  const response = await api.get(`/api/transactions/${currentUserId()}`);
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
  const payload = await createSignedDepositPayload(amount);
  const response = await api.post('/api/deposit', payload);
  return response.data;
}
