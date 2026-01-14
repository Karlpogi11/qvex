const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://192.168.1.111:5173', // allow all origins for testing; replace with your React URL in production
    methods: ['GET', 'POST']
  }
});

// Parse JSON body
app.use(express.json());

// Endpoint Laravel will POST to
app.post('/event', (req, res) => {
  const data = req.body;
  console.log('✅ Event received from Laravel:', data);

  // Emit to all connected clients
  io.emit('queue_event', data);

  // Optional: log confirmation in console
  console.log(`➡ Broadcasted event to clients: ${data.type} - Queue: ${data.queue_number}`);

  res.json({ status: 'ok' });
});

// Socket.io connection listener
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Start server
server.listen(3001, () => {
  console.log('⚡ Socket.io server running on port 3001');
});