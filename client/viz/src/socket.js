import { io } from 'socket.io-client';

export const socket = io('ws://localhost:3001', {
  transports: ['websocket']
});

export const SOCKET_EVENTS = [
  'request-received',
  'check-signature',
  'check-timestamp',
  'check-nonce',
  'check-requestid',
  'check-balance',
  'transaction-result',
  'db-update',
  'redis-update',
  'reset'
];

export function registerSocketListeners(handlers) {
  socket.on('request-received', handlers.onRequestReceived);
  socket.on('check-signature', handlers.onCheckSignature);
  socket.on('check-timestamp', handlers.onCheckTimestamp);
  socket.on('check-nonce', handlers.onCheckNonce);
  socket.on('check-requestid', handlers.onCheckRequestId);
  socket.on('check-balance', handlers.onCheckBalance);
  socket.on('transaction-result', handlers.onTransactionResult);
  socket.on('db-update', handlers.onDbUpdate);
  socket.on('redis-update', handlers.onRedisUpdate);
  socket.on('reset', handlers.onReset);

  return () => {
    socket.off('request-received', handlers.onRequestReceived);
    socket.off('check-signature', handlers.onCheckSignature);
    socket.off('check-timestamp', handlers.onCheckTimestamp);
    socket.off('check-nonce', handlers.onCheckNonce);
    socket.off('check-requestid', handlers.onCheckRequestId);
    socket.off('check-balance', handlers.onCheckBalance);
  socket.off('transaction-result', handlers.onTransactionResult);
  socket.off('db-update', handlers.onDbUpdate);
  socket.off('redis-update', handlers.onRedisUpdate);
  socket.off('reset', handlers.onReset);
  };
}
