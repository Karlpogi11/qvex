// printer.js
import epson from './qvex-frontend/public/epson';

const printerIP = '192.168.1.178';
const printerPort = 9100;

// Connect to Epson printer
export const printQueueNumber = async (queueNumber) => {
  try {
    const epos = new epson();
    const printer = new epos.Printer({
      target: printerIP,
      port: printerPort
    });

    await printer.connect();

    // Format the print content
    const content = `
      -----------------------
      Queue Number
      -----------------------
      ${queueNumber}
      -----------------------
      Thank you!
    `;

    await printer.print(content);
    await printer.disconnect();
    console.log(`Printed queue number: ${queueNumber}`);
  } catch (err) {
    console.error('Failed to print:', err);
  }
};
