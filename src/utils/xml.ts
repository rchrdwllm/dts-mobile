export interface ScanRecordInput {
  inputNumber: string;
  qrCodeData: string;
  timestamp?: string;
}

/**
 * Escapes special XML characters: <, >, &, ', "
 */
export const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

/**
 * Serializes scan details into formatted XML payload strictly matching Option A format.
 */
export const serializeScanRecord = ({
  inputNumber,
  qrCodeData,
  timestamp,
}: ScanRecordInput): string => {
  const isoTimestamp = timestamp || new Date().toISOString();
  const escapedInputNumber = escapeXml(inputNumber);
  const escapedQrCodeData = escapeXml(qrCodeData);

  return `<ScanRecord>
  <InputNumber>${escapedInputNumber}</InputNumber>
  <QRCodeData>${escapedQrCodeData}</QRCodeData>
  <Timestamp>${isoTimestamp}</Timestamp>
</ScanRecord>`;
};
