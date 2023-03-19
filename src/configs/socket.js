const socketIO = require('socket.io');

module.exports = (httpServer) => {
  const io = socketIO(httpServer, {
    allowEIO3: true,
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log('Connection Socket.io...');
    socket.on('disconnect', () => {
      console.log('Disconnect Socket.io...');
    });

    const token = socket.handshake.auth.token;
    const user = {
      socketId: socket.id,
      username: token,
    }

    socket.emit('socketUser', user);
  });
};

