export interface ScanRecordInput {
  batteryCode?: string;
  droneSerial?: string;
  date?: string;
  /** Legacy alias for batteryCode */
  inputNumber?: string;
  /** Legacy alias for droneSerial */
  qrCodeData?: string;
  /** Legacy alias for date */
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
 * Formats a date string or timestamp to "YYYY-MM-DD"
 */
const formatDateStr = (inputDate?: string): string => {
  if (inputDate) {
    // If inputDate is already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      return inputDate;
    }
    const d = new Date(inputDate);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates a formatted single <Scan> block string.
 */
const formatScanNode = (scanInput: ScanRecordInput): string => {
  const bCode = scanInput.batteryCode ?? scanInput.inputNumber ?? '';
  const dSerial = scanInput.droneSerial ?? scanInput.qrCodeData ?? '';
  const formattedDate = formatDateStr(scanInput.date ?? scanInput.timestamp);

  const escapedBatteryCode = escapeXml(bCode);
  const escapedDroneSerial = escapeXml(dSerial);

  return `  <Scan>
    <BatteryCode>${escapedBatteryCode}</BatteryCode>
    <DroneSerial>${escapedDroneSerial}</DroneSerial>
    <Date>${formattedDate}</Date>
    <Replacement></Replacement>
    <FOM></FOM>
    <FOMdate></FOMdate>
    <FOM2></FOM2>
    <FOM2date></FOM2date>
    <FOM3></FOM3>
    <FOM3date></FOM3date>
  </Scan>`;
};

/**
 * Serializes scan details into formatted XML payload strictly matching Battery_DATA.xml format.
 */
export const serializeScanRecord = ({
  batteryCode,
  droneSerial,
  date,
  inputNumber,
  qrCodeData,
  timestamp,
}: ScanRecordInput): string => {
  const scanNode = formatScanNode({
    batteryCode,
    droneSerial,
    date,
    inputNumber,
    qrCodeData,
    timestamp,
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<QRCodeScans>
${scanNode}
</QRCodeScans>`;
};

/**
 * Appends a new scan entry into existing Battery_DATA.xml string before </QRCodeScans>.
 * If existingXml is null, empty, or malformed without </QRCodeScans>, returns a fresh root document.
 */
export const appendScanToXml = (
  existingXml: string | null | undefined,
  scanInput: ScanRecordInput
): string => {
  if (!existingXml || typeof existingXml !== 'string') {
    console.log('[XML Util] Existing XML is empty/null. Serializing fresh scan record.');
    return serializeScanRecord(scanInput);
  }

  // Find the LAST occurrence of </QRCodeScans> (case-insensitive)
  const matches = [...existingXml.matchAll(/<\/QRCodeScans\s*>/gi)];
  if (matches.length === 0) {
    console.warn('[XML Util] Closing tag </QRCodeScans> not found in existing XML. Serializing fresh document.');
    return serializeScanRecord(scanInput);
  }

  const lastMatch = matches[matches.length - 1];
  const closeTagIndex = lastMatch.index!;

  const scanNode = formatScanNode(scanInput);
  const beforeCloseTag = existingXml.slice(0, closeTagIndex).trimEnd();

  const resultXml = `${beforeCloseTag}\n${scanNode}\n</QRCodeScans>`;
  console.log(`[XML Util] Appended scan entry before closing tag at index ${closeTagIndex}. Initial length: ${existingXml.length}, New length: ${resultXml.length}`);
  return resultXml;
};



