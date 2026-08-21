import { escapeXml, serializeScanRecord } from '../xml';

describe('escapeXml', () => {
  it('should escape special XML characters', () => {
    expect(escapeXml('<hello> & "world" \'test\'')).toBe('&lt;hello&gt; &amp; &quot;world&quot; &apos;test&apos;');
  });

  it('should return unchanged string if no special characters exist', () => {
    expect(escapeXml('ABC123xyz')).toBe('ABC123xyz');
  });

  it('should handle empty string', () => {
    expect(escapeXml('')).toBe('');
  });
});

describe('serializeScanRecord', () => {
  it('should format XML matching Battery_DATA.xml structure with given date', () => {
    const result = serializeScanRecord({
      batteryCode: 'GE0588927',
      droneSerial: 'R12022019',
      date: '2025-08-08',
    });

    const expected = `<?xml version="1.0" encoding="utf-8"?>
<QRCodeScans>
  <Scan>
    <BatteryCode>GE0588927</BatteryCode>
    <DroneSerial>R12022019</DroneSerial>
    <Date>2025-08-08</Date>
    <Replacement></Replacement>
    <FOM></FOM>
    <FOMdate></FOMdate>
    <FOM2></FOM2>
    <FOM2date></FOM2date>
    <FOM3></FOM3>
    <FOM3date></FOM3date>
  </Scan>
</QRCodeScans>`;
    expect(result).toBe(expected);
  });

  it('should support legacy parameter aliases (inputNumber, qrCodeData, timestamp)', () => {
    const result = serializeScanRecord({
      inputNumber: 'GE0588927',
      qrCodeData: 'R12022019',
      timestamp: '2025-08-08T12:00:00.000Z',
    });

    expect(result).toContain('<BatteryCode>GE0588927</BatteryCode>');
    expect(result).toContain('<DroneSerial>R12022019</DroneSerial>');
    expect(result).toContain('<Date>2025-08-08</Date>');
  });

  it('should escape special characters in batteryCode and droneSerial', () => {
    const result = serializeScanRecord({
      batteryCode: 'GE<588>&',
      droneSerial: 'R120"22\'19',
      date: '2025-08-08',
    });

    expect(result).toContain('<BatteryCode>GE&lt;588&gt;&amp;</BatteryCode>');
    expect(result).toContain('<DroneSerial>R120&quot;22&apos;19</DroneSerial>');
  });

  it('should format today\'s date as YYYY-MM-DD if no date is provided', () => {
    const result = serializeScanRecord({
      batteryCode: 'GE0588927',
      droneSerial: 'R12022019',
    });

    const dateMatch = result.match(/<Date>(\d{4}-\d{2}-\d{2})<\/Date>/);
    expect(dateMatch).not.toBeNull();
    const todayStr = new Date().toISOString().split('T')[0];
    expect(dateMatch![1]).toBe(todayStr);
  });
});

