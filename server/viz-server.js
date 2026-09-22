const { Server } = require('socket.io');

let io = null;
let serverInstance = null;

function startVizServer(options = {}) {
  if (io) {
    return io;
  }

  const port = Number(options.port || process.env.VIZ_PORT || 3001);

  io = new Server(port, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.emit('request-received', {
      user: 'dashboard',
      amount: 0,
      type: 'CONNECTED'
    });
  });

  serverInstance = io.httpServer;
  console.log(`Viz Socket.io server listening on port ${port}`);
  return io;
}

function emitVizEvent(eventName, data) {
  if (!io) {
    return;
  }
  io.emit(eventName, data);
}

function stopVizServer(callback) {
  if (!io || !serverInstance) {
    if (callback) callback();
    return;
  }

  io.close(() => {
    io = null;
    serverInstance = null;
    if (callback) callback();
  });
}

if (require.main === module) {
  require('dotenv').config();
  startVizServer();
}

module.exports = {
  startVizServer,
  emitVizEvent,
  stopVizServer
};
