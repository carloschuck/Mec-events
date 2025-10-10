import QRCode from 'qrcode';

class QRService {
  async generateQRCode(registrationId) {
    try {
      // Generate QR code data URL
      const qrData = `MEC-REG-${registrationId}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQRBuffer(registrationId) {
    try {
      const qrData = `MEC-REG-${registrationId}`;
      const buffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.95,
        margin: 1,
        width: 300
      });

      return buffer;
    } catch (error) {
      console.error('Error generating QR buffer:', error);
      throw new Error('Failed to generate QR buffer');
    }
  }

  parseQRCode(qrData) {
    // Extract registration ID from QR code data
    const match = qrData.match(/MEC-REG-(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return null;
  }
}

export default new QRService();

