const net = require('net');

const PRINTER_IP = '192.168.1.178';
const PORT = 9100;

const client = new net.Socket();

client.connect(PORT, PRINTER_IP, () => {
  console.log('Connected to printer');

  // ESC/POS command: print "Hello World" and cut
  const message = Buffer.from('Hello World\n\x1D\x56\x41', 'ascii');
  client.write(message);
  console.log('Message sent');
  client.end();
});

client.on('error', (err) => {
  console.error('Printer error:', err);
});

client.on('close', () => {
  console.log('Connection closed');
});
