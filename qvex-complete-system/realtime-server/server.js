const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    transports: ['websocket', 'polling'],
  },
});

app.use(express.json());

// 🔁 Laravel → Node → Display
app.post('/event', (req, res) => {
  const payload = req.body;

  if (!payload || !payload.type) {
    return res.status(400).json({ error: 'Invalid event payload' });
  }

  console.log('✅ Event received from Laravel:', payload);

  io.emit('queue_event', payload);

  res.json({ status: 'ok' });
});

// 🔌 socket lifecycle
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

server.listen(3001, '0.0.0.0', () => {
  console.log('⚡ Socket.io server running on port 3001');
});
