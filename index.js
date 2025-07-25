const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://abdullah.ghiblify.store',
    'https://lexora-taupe.vercel.app',
    'https://lexora-o72ve7szt-coder-philosophers-projects.vercel.app',
    'https://lexora.nitrr.in',
    'https://6755dca70f558b000846af33--subtle-cannoli-a2576f.netlify.app',

  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', ' '); 
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


app.use(cookieParser());
app.use(express.json());

connectDB();

app.use(express.static('public'));

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const server = http.createServer(app);
const allowedOrigins = [
  'https://lexora-taupe.vercel.app',
  'http://localhost:5173',
  'https://lexora-backend-lbmv.vercel.app',
  'https://lexora.nitrr.in',
  'https://abdullah.ghiblify.store',
  'https://lexora-o72ve7szt-coder-philosophers-projects.vercel.app',
  'https://6755dca70f558b000846af33--subtle-cannoli-a2576f.netlify.app',
  
];

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., from Postman or local testing)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS Error: Origin ${origin} not allowed`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.set('socketio', io);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes(io)); 

// app.get('*', (_, res) => {
//   res.sendFile(`${__dirname}/public/download.png`);
// });

app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

io.on('connection', (socket) => {
  // console.log(`New client connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    // console.log(`Client joined room: ${roomId}`);
  });

  socket.on('chatMessage', ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join('-');
    io.to(roomId).emit('message', {
      senderLexusId: senderId,
      message,
    });
    // console.log(`Message sent to room: ${roomId}`);
  });

  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    // console.log(`Client left room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    // console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
