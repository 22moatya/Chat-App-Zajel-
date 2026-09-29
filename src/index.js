require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./Models/userModel');
const Room = require('./Models/roomModel');
const Message = require('./Models/messageModel');
const authRoutes = require('./Routes/authRoutes');
const roomRoutes = require('./Routes/roomRoutes');
const messageRoutes = require('./Routes/messageRoute');


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
// 404 handler - لأي route مش موجود
app.use((req, res) => {
    res.status(404).json({message: 'Route not found'});
});

// Global error handler - بيلقط أي error مش متعالج في الـ middlewares/routes
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({message: 'Internal Server Error'});
});



// health check
app.get('/health', (req, res) => {
    res.status(200).send({status: 'OK'});
});
// socket
app.set('io', io);

// const onlineUsers = new Set(); // Set to store online users
const onlineUsers = new Map(); // userId -> عدد الاتصالات النشطة
io.on('connection', (socket) => {
     const token = socket.handshake.query.token;
     if(!token) {
         socket.emit('error', 'Authorization error: No token provided');
         socket.disconnect();
         return;
     }
     try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        User.findById(decoded.userId).then((user) => {
            if(!user) {
                socket.emit('error', 'Authorization error: User not found');
                socket.disconnect();
                return;
            }
            socket.data.userId = user._id.toString();
            socket.data.user = user;
            console.log('user connected' + user.name);
            
            // //المستخدم الاونلاين
            // onlineUsers.add(socket.data.userId);
            // io.emit('online-users', { userid: socket.data.userId, username: socket.data.user.name });
            const userId = socket.data.userId;
            onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
            if (onlineUsers.get(userId) === 1) {
            // أول اتصال للمستخدم ده بس اللي بيبقى "online"
            io.emit("online-users", { userid: userId, username: socket.data.user.name });
            }
            
            //انضمام للغرفة
            socket.on("join-room", async (data) => {
              const roomId = data.roomId;
              if (!roomId) {
                socket.emit("error", "Room ID is required");
                return;
              }
              if (!socket.data.userId) {
                socket.emit(
                  "error",
                  "Authorization error: User not authenticated",
                );
                return;
              }
              try {
                const room = await Room.findById(roomId);
                if (!room) {
                  socket.emit("error", "Room not found");
                  return;
                }
                if (room.isPrivate) {
                  const isMember = room.members?.some(
                    (memb) => memb.toString() === socket.data.userId,
                  );
                  if (!isMember) {
                    socket.emit("error", "You are not a member of this room");
                    return;
                  }
                }
                // بقت برا شرط isPrivate، فبقت بتشتغل للغرف العامة كمان
                await socket.join(roomId);
                socket.emit("joined-room", { roomId });
                console.log(
                  `User ${socket.data.user.name} joined room ${room.name}`,
                );
              } catch (error) {
                socket.emit("error", "Authorization error:" + error.message);
                socket.disconnect();
                return;
              }
            });
            
            //ارسال رسالة
            socket.on('send-message', async (data) => {
                const {roomId, text} = data || {};
                if(!roomId || !text || !text.trim()) {
                    socket.emit('error', 'Room ID and message text are required');
                    return;
                }
                if(!socket.data.userId) {
                    socket.emit('error', 'Authorization error: User not authenticated');
                    return;
                }

                try{
                  const room = await Room.findById(roomId);
                  if(!room) {
                      socket.emit('error', 'Room not found');
                      return;
                  }
                  if(room.isPrivate) {
                      const isMember = room.members?.some(
                          (memb) => memb.toString()  === socket.data.userId
                      );
                      if(!isMember) {
                          socket.emit('error', 'You are not a member of this room');
                          return;
                      }
                  }
                  const message = await Message.create({
                      room: roomId,
                      sender: socket.data.userId,
                      text: text.trim()
                  })

                  const userData = await Message.findById(message._id)
                  .populate('sender', 'name displayName')
                  .lean(); // lean() returns a plain JavaScript object instead of a mongoose document

                  io.to(roomId).emit('new-message', userData);
                } catch(error) {
                    socket.emit('error', 'Authorization error:' + error.message);
                    socket.disconnect();
                    return;
                }
            });
            
            //التحقق من ان الناس يكتبون
            socket.on('start-typing', (data) => {
                const roomId = data.roomId;
                if(!roomId || !socket.data.userId) return;
                socket.to(roomId).emit('user-typing', { userid: socket.data.userId, username: socket.data.user.name });
            });

            //التحقق من ان الناس يتوقفون
            socket.on('stop-typing', (data) => {
                const roomId = data.roomId;
                if(!roomId || !socket.data.userId) return;
                socket.to(roomId).emit('user-stopped-typing', { userid: socket.data.userId, username: socket.data.user.name });
            });

            }).catch((err) => {
            socket.emit('error', 'Authorization error:' + err.message);
            socket.disconnect();
            return;
        })
        } catch(error) {
            socket.emit('error', 'Authorization error:' + error.message);
            socket.disconnect();
            return;
        }

        socket.on('disconnect', () => {
        if(socket.data.userId){
        const userId = socket.data.userId;
        const count = (onlineUsers.get(userId) || 1) - 1;
        if(count <= 0) {
            onlineUsers.delete(userId);
            io.emit('user-offline', { userid: userId, username: socket.data.user.name });
        } else {
            onlineUsers.set(userId, count);
        }
    }
    console.log('user disconnected:' + socket.id);
});
});




server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});