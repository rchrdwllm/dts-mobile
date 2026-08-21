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
  const bCode = batteryCode ?? inputNumber ?? '';
  const dSerial = droneSerial ?? qrCodeData ?? '';
  const formattedDate = formatDateStr(date ?? timestamp);

  const escapedBatteryCode = escapeXml(bCode);
  const escapedDroneSerial = escapeXml(dSerial);

  return `<?xml version="1.0" encoding="utf-8"?>
<QRCodeScans>
  <Scan>
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
  </Scan>
</QRCodeScans>`;
};

