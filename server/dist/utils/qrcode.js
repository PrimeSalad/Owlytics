"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudentQRCode = generateStudentQRCode;
const qrcode_1 = __importDefault(require("qrcode"));
async function generateStudentQRCode(studentId, firstName, lastName, section) {
    try {
        // QR code: STUDENTID|FIRSTNAME LASTNAME - scannable and unique per student
        const qrData = `${studentId}|${firstName} ${lastName}`;
        // Generate QR code as data URL
        const qrUrl = await qrcode_1.default.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return { qrData, qrUrl };
    }
    catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}
