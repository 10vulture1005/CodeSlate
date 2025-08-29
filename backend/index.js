import express from 'express'
import bodyParser from 'body-parser'
import { Server } from 'socket.io'
import { createServer } from 'http'
import connectDB from './config/database.js'
import userRoutes from './routes/users.js'


const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://code-slate-two.vercel.app/",
    "https://*.vercel.app"
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => allowed.includes('*'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

connectDB();

app.use('/users', userRoutes);

const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, { 
  cors: {
    origin: [
      "https://code-slate-two.vercel.app/",  
      "http://localhost:3000"              
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

httpServer.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
  console.log(`Socket.IO server attached to Express server`);
});

const userMap = new Map();      
const socketMap = new Map();    
const rooms = new Map();        
const activeCalls = new Map(); 

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('join-room', ({ email, roomid }) => {
    console.log(`${email} joined room ${roomid} (socket: ${socket.id})`);

    if (userMap.has(email)) {
      const oldData = userMap.get(email);
      socketMap.delete(oldData.socketId);
    }

    userMap.set(email, { 
      socketId: socket.id, 
      roomId: roomid, 
      status: 'online' 
    });
    socketMap.set(socket.id, email);
    socket.join(roomid);

    if (!rooms.has(roomid)) {
      rooms.set(roomid, new Set());
    }
    
    const usersInRoom = rooms.get(roomid);
    const existingUsers = Array.from(usersInRoom);

    if (existingUsers.length > 0) {
      socket.emit('existing-users', { users: existingUsers });
      console.log(`Sent existing users to ${email}:`, existingUsers);
    }

    usersInRoom.add(email);

    socket.broadcast.to(roomid).emit('user-joined', { email });
    console.log(` Notified room ${roomid} about new user: ${email}`);
  });

  socket.on('calling-user', (data) => {
    const { email: targetEmail, offer } = data;
    const fromEmail = socketMap.get(socket.id);
    const targetUser = userMap.get(targetEmail);

    if (!fromEmail) {
      console.warn(` Caller not found for socket ${socket.id}`);
      return;
    }

    if (!targetUser) {
      console.warn(`Target user ${targetEmail} not found`);
      socket.emit('call-failed', { 
        targetEmail, 
        reason: 'User not online' 
      });
      return;
    }

    if (targetUser.status !== 'online') {
      console.warn(` Target user ${targetEmail} is ${targetUser.status}`);
      socket.emit('call-failed', { 
        targetEmail, 
        reason: `User is ${targetUser.status}` 
      });
      return;
    }

    const callerData = userMap.get(fromEmail);
    if (callerData.status !== 'online') {
      console.warn(` Caller ${fromEmail} is already ${callerData.status}`);
      return;
    }

    callerData.status = 'calling';
    targetUser.status = 'calling';

    activeCalls.set(fromEmail, { with: targetEmail, offer });
    activeCalls.set(targetEmail, { with: fromEmail });

    console.log(` ${fromEmail} is calling ${targetEmail}`);
    
    socket.to(targetUser.socketId).emit('incomming-call', {
      email: fromEmail,
      offer: offer,
    });


  });

  socket.on('call-accepted', (data) => {
    const { email: callerEmail, ans } = data;
    const accepterEmail = socketMap.get(socket.id);
    const callerUser = userMap.get(callerEmail);

    if (!accepterEmail || !callerUser) {
      console.warn(` Invalid call acceptance`);
      return;
    }

    const call = activeCalls.get(accepterEmail);
    if (!call || call.with !== callerEmail) {
      console.warn(` No active call between ${accepterEmail} and ${callerEmail}`);
      return;
    }

    const accepterUser = userMap.get(accepterEmail);
    callerUser.status = 'in-call';
    accepterUser.status = 'in-call';

    call.answer = ans;
    activeCalls.get(callerEmail).answer = ans;

    console.log(` Call accepted: ${accepterEmail} ↔ ${callerEmail}`);
    
    socket.to(callerUser.socketId).emit('call-accepted', { 
      email: accepterEmail,
      ans 
    });
  });

  socket.on('call-rejected', (data) => {
    const { email: callerEmail } = data;
    const rejecterEmail = socketMap.get(socket.id);
    
    if (rejecterEmail && callerEmail) {
      endCall(rejecterEmail, callerEmail, 'rejected');
      
      const callerUser = userMap.get(callerEmail);
      if (callerUser) {
        socket.to(callerUser.socketId).emit('call-rejected', { 
          email: rejecterEmail 
        });
      }
      
      console.log(` Call rejected: ${rejecterEmail} rejected ${callerEmail}`);
    }
  });

  socket.on('end-call', async (data) => {
    const email = socketMap.get(socket.id);
    if (email) {
      const call = activeCalls.get(email);
      if (call) {
        const otherEmail = call.with;
        const duration = data?.duration || 0; 
        
        endCall(email, otherEmail, 'ended');
        
        const otherUser = userMap.get(otherEmail);
        if (otherUser) {
          socket.to(otherUser.socketId).emit('call-ended', { email });
        }
        
        try {
          await CallHistory.create({
            userId: email, 
            callType: 'outgoing',
            duration: duration,
            remoteEmail: otherEmail,
            status: 'completed'
          });
          
          await CallHistory.create({
            userId: otherEmail, 
            callType: 'incoming',
            duration: duration,
            remoteEmail: email,
            status: 'completed'
          });
          
          console.log(`Call history tracked for ${email} and ${otherEmail}`);
        } catch (error) {
          console.error('Error tracking call history:', error);
        }
        
        console.log(`Call ended by ${email}`);
      }
    }
  });


  
  socket.on('disconnect', () => {
    const email = socketMap.get(socket.id);
    
    if (email) {
      const call = activeCalls.get(email);
      if (call) {
        endCall(email, call.with, 'disconnected');
        const otherUser = userMap.get(call.with);
        if (otherUser) {
          io.to(otherUser.socketId).emit('call-ended', { 
            email,
            reason: 'disconnected' 
          });
        }
      }

      const userData = userMap.get(email);
      if (userData && userData.roomId) {
        const roomUsers = rooms.get(userData.roomId);
        if (roomUsers) {
          roomUsers.delete(email);
          if (roomUsers.size === 0) {
            rooms.delete(userData.roomId);
          }
        }
      }

      userMap.delete(email);
      activeCalls.delete(email);
      
      socket.broadcast.emit('user-disconnected', { email });
    }
    
    socketMap.delete(socket.id);
    console.log(` Disconnected: ${socket.id} (${email || "unknown"})`);
  });

  function endCall(email1, email2, reason = 'ended') {
    const user1 = userMap.get(email1);
    const user2 = userMap.get(email2);
    
    if (user1) user1.status = 'online';
    if (user2) user2.status = 'online';
    
    activeCalls.delete(email1);
    activeCalls.delete(email2);
    
    console.log(` Call ${reason}: ${email1} ↔ ${email2}`);
  }
});