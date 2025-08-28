import express from 'express'
import bodyParser from 'body-parser'
import { Server } from 'socket.io'
import { createServer } from 'http'
import connectDB from './config/database.js'
import userRoutes from './routes/users.js'
import callHistoryRoutes from './routes/callHistory.js'
import CallHistory from './models/callHistory.js'

const app = express();

// CORS middleware for Express
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

// Connect to MongoDB
// connectDB();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/call-history', callHistoryRoutes);

// Get port from environment variable or use default
const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Create HTTP server
const httpServer = createServer(app);

// --- Setup Socket.IO with the HTTP server
const io = new Server(httpServer, { 
  cors: {
    origin: [
      "https://code-slate-two.vercel.app/",  // your Vercel frontend
      "http://localhost:3000"              // local dev
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
  console.log(`Socket.IO server attached to Express server`);
});

// --- Enhanced Data Structures
const userMap = new Map();      // email -> { socketId, roomId, status: 'online'|'calling'|'in-call' }
const socketMap = new Map();    // socket.id -> email
const rooms = new Map();        // roomid -> Set(emails)
const activeCalls = new Map();  // email -> { with: email, offer?: any, answer?: any }

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // --- Handle Joining a Room
  socket.on('join-room', ({ email, roomid }) => {
    console.log(`${email} joined room ${roomid} (socket: ${socket.id})`);

    // Clean up any previous connection for this email
    if (userMap.has(email)) {
      const oldData = userMap.get(email);
      socketMap.delete(oldData.socketId);
    }

    // Set up new connection
    userMap.set(email, { 
      socketId: socket.id, 
      roomId: roomid, 
      status: 'online' 
    });
    socketMap.set(socket.id, email);
    socket.join(roomid);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomid)) {
      rooms.set(roomid, new Set());
    }
    
    const usersInRoom = rooms.get(roomid);
    const existingUsers = Array.from(usersInRoom);

    // Send existing users to the new joinee
    if (existingUsers.length > 0) {
      socket.emit('existing-users', { users: existingUsers });
      console.log(`Sent existing users to ${email}:`, existingUsers);
    }

    // Add new user to room
    usersInRoom.add(email);

    // Notify existing users about the new joinee
    socket.broadcast.to(roomid).emit('user-joined', { email });
    console.log(` Notified room ${roomid} about new user: ${email}`);
  });

  // --- Handle Calling Another User
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

    // Check if target user is already in a call or being called
    if (targetUser.status !== 'online') {
      console.warn(` Target user ${targetEmail} is ${targetUser.status}`);
      socket.emit('call-failed', { 
        targetEmail, 
        reason: `User is ${targetUser.status}` 
      });
      return;
    }

    // Check if caller is already in a call
    const callerData = userMap.get(fromEmail);
    if (callerData.status !== 'online') {
      console.warn(` Caller ${fromEmail} is already ${callerData.status}`);
      return;
    }

    // Update statuses
    callerData.status = 'calling';
    targetUser.status = 'calling';

    // Store call information
    activeCalls.set(fromEmail, { with: targetEmail, offer });
    activeCalls.set(targetEmail, { with: fromEmail });

    console.log(` ${fromEmail} is calling ${targetEmail}`);
    
    // Send incoming call to target
    socket.to(targetUser.socketId).emit('incomming-call', {
      email: fromEmail,
      offer: offer,
    });

    // Set call timeout (30 seconds)
        // setTimeout(() => {
        //   const currentCall = activeCalls.get(fromEmail);
        //   if (currentCall && currentCall.with === targetEmail) {
        //     // Call timed out
        //     endCall(fromEmail, targetEmail, 'timeout');
        //     socket.emit('call-timeout', { targetEmail });
        //     socket.to(targetUser.socketId).emit('call-timeout', { email: fromEmail });
        //   }
        // }, 30000);
  });

  // --- Handle Accepting a Call
  socket.on('call-accepted', (data) => {
    const { email: callerEmail, ans } = data;
    const accepterEmail = socketMap.get(socket.id);
    const callerUser = userMap.get(callerEmail);

    if (!accepterEmail || !callerUser) {
      console.warn(` Invalid call acceptance`);
      return;
    }

    // Verify this is a valid active call
    const call = activeCalls.get(accepterEmail);
    if (!call || call.with !== callerEmail) {
      console.warn(` No active call between ${accepterEmail} and ${callerEmail}`);
      return;
    }

    // Update statuses to in-call
    const accepterUser = userMap.get(accepterEmail);
    callerUser.status = 'in-call';
    accepterUser.status = 'in-call';

    // Update call data
    call.answer = ans;
    activeCalls.get(callerEmail).answer = ans;

    console.log(` Call accepted: ${accepterEmail} ↔ ${callerEmail}`);
    
    // Send answer to caller
    socket.to(callerUser.socketId).emit('call-accepted', { 
      email: accepterEmail,
      ans 
    });
  });

  // --- Handle Call Rejection
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

  // --- Handle Call End
  socket.on('end-call', async (data) => {
    const email = socketMap.get(socket.id);
    if (email) {
      const call = activeCalls.get(email);
      if (call) {
        const otherEmail = call.with;
        const duration = data?.duration || 0; // Duration in seconds
        
        endCall(email, otherEmail, 'ended');
        
        const otherUser = userMap.get(otherEmail);
        if (otherUser) {
          socket.to(otherUser.socketId).emit('call-ended', { email });
        }
        
        // Track call history for both users
        try {
          // For the caller
          await CallHistory.create({
            userId: email, // This should be the actual user ID, not email
            callType: 'outgoing',
            duration: duration,
            remoteEmail: otherEmail,
            status: 'completed'
          });
          
          // For the receiver
          await CallHistory.create({
            userId: otherEmail, // This should be the actual user ID, not email
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

  // --- Handle Disconnection

  
  socket.on('disconnect', () => {
    const email = socketMap.get(socket.id);
    
    if (email) {
      // End any active calls
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

      // Remove from room
      const userData = userMap.get(email);
      if (userData && userData.roomId) {
        const roomUsers = rooms.get(userData.roomId);
        if (roomUsers) {
          roomUsers.delete(email);
          // Clean up empty rooms
          if (roomUsers.size === 0) {
            rooms.delete(userData.roomId);
          }
        }
      }

      // Clean up maps
      userMap.delete(email);
      activeCalls.delete(email);
      
      // Notify others
      socket.broadcast.emit('user-disconnected', { email });
    }
    
    socketMap.delete(socket.id);
    console.log(` Disconnected: ${socket.id} (${email || "unknown"})`);
  });

  // --- Helper function to end calls
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