const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

module.exports = (httpServer) => {
  const io = socketIO(httpServer, {
    allowEIO3: true,
    cors: {
      origin: true,
      credentials: true,
      transports: ['websocket', 'polling', 'flashsocket'],
      upgrade:false
    },
  });

  //Danh sách người dùng kết nối
  var socketIds = {};

  io.on("connection", async (socket) => {
    console.log(`User ${socket.id} is connected`);
    const bearerHeader = socket.handshake.auth.token;
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    try{
      const user = await jwt.verify(token, 'secretKey');
      socket.user = user.data;
      //Set người dùng vào danh sách
      socketIds[socket.user.username] =  socket.id;
      console.log(socketIds)
    }
    catch (e) {
      // if token is invalid, close connection
      console.log('error', e.message);
    }

    socket.join("_room" + socket.user.username);

    socket.on('handleUpdateAppointment', function (username) {
      // socket.broadcast.emit('notification', `User ${socket.user.username} gửi thông báo`);
      const receiverId = socketIds[username]
      socket.broadcast.to(receiverId).emit('notification', `User ${socket.user.username} gửi thông báo`);
    })

    socket.on('disconnect', () => {
      console.log(`User ${socket.id} is disconnected`);
    });
  });

  return io;
};

