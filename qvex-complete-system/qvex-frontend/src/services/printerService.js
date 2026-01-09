// src/services/printerService.js

export const printQueueNumber = (queueNumber) => {
  const tryPrint = () => {
    if (!window.epson) {
      console.warn('Epson library not loaded yet, retrying...');
      setTimeout(tryPrint, 100);
      return;
    }

    const device = new window.epson.ePOSDevice();
    device.connect('192.168.1.178', 9100, (code, msg) => {
      if (code !== 'OK') {
        console.error('Connection error:', code, msg);
        return;
      }

      const printer = device.createDevice(
        'local_printer',
        device.DEVICE_TYPE_PRINTER,
        { crypto: false }
      );

      printer.addText(`Queue Number: ${queueNumber}\n`);
      printer.addFeedLine(2);
      printer.addCut(window.epson.ePOSPrinter.CUT_FEED);
      printer.send();
    });
  };

  tryPrint();
};
