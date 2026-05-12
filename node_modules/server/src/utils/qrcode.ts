import QRCode from 'qrcode';

export async function generateStudentQRCode(
  studentId: string,
  firstName: string,
  lastName: string,
  section: string
): Promise<{ qrData: string; qrUrl: string }> {
  try {
    // Standardized format: SMS|STUDENT_ID|NAME|SECTION
    const qrData = `SMS|${studentId}|${firstName} ${lastName}|${section}`;

    // Still generate qrUrl for backward compatibility or if needed by other server-side logic
    // but the main goal is the qrData
    const qrUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrData, qrUrl };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
