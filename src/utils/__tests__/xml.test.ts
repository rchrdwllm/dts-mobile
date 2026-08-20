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
  it('should format XML structure correctly with given timestamp', () => {
    const timestamp = '2026-08-20T12:00:00.000Z';
    const result = serializeScanRecord({
      inputNumber: 'REF123',
      qrCodeData: 'https://example.com/qr/999',
      timestamp,
    });

    const expected = `<ScanRecord>\n  <InputNumber>REF123</InputNumber>\n  <QRCodeData>https://example.com/qr/999</QRCodeData>\n  <Timestamp>2026-08-20T12:00:00.000Z</Timestamp>\n</ScanRecord>`;
    expect(result).toBe(expected);
  });

  it('should escape special characters in inputNumber and qrCodeData', () => {
    const timestamp = '2026-08-20T12:00:00.000Z';
    const result = serializeScanRecord({
      inputNumber: 'REF<123>&',
      qrCodeData: 'https://example.com?a=1&b="test\'',
      timestamp,
    });

    expect(result).toContain('<InputNumber>REF&lt;123&gt;&amp;</InputNumber>');
    expect(result).toContain('<QRCodeData>https://example.com?a=1&amp;b=&quot;test&apos;</QRCodeData>');
  });

  it('should generate an ISO timestamp if none is provided', () => {
    const result = serializeScanRecord({
      inputNumber: '123',
      qrCodeData: 'TEST',
    });

    expect(result).toMatch(/<Timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z<\/Timestamp>/);
  });
});
