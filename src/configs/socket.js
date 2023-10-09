const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

module.exports = (httpServer) => {
  const io = socketIO(httpServer, {
    // allowEIO3: true,
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    console.log(`User ${socket.id} is connected`);
    const bearerHeader = socket.handshake.auth.token;
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    try{
      const user = await jwt.verify(token, 'secretKey');
      socket.user = user.data;
    }
    catch (e) {
      // if token is invalid, close connection
      console.log('error', e.message);
    }
    socket.on('handleUpdateAppointment', function () {
      socket.broadcast.emit('notification', `User ${socket.user.username} gửi thông báo`);
    })

    socket.on('disconnect', () => {
      console.log(`User ${socket.id} is disconnected`);
    });
  });
};

