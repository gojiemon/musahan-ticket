import QRCode from "qrcode";

export async function generateQRDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256
  });
}

