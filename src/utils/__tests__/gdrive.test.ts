import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import {
  uploadXmlFile,
  findFileInFolder,
  downloadFileContent,
  updateXmlFile,
  syncScanToGoogleDrive,
  TARGET_FOLDER_ID,
} from '../gdrive';

// Mock native Google Sign In module
jest.mock('react-native-nitro-google-signin', () => {
  return {
    GoogleOneTapSignIn: {
      getTokens: jest.fn(),
      clearCachedAccessToken: jest.fn(),
    },
  };
}, { virtual: true });

describe('Google Drive Sync API Utilities', () => {
  const mockAccessToken = 'mock-access-token-123';
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    (globalThis as any).fetch = mockFetch;
  });

  describe('findFileInFolder', () => {
    it('should return file ID if matching file exists in target folder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [{ id: 'existing-file-123', name: 'Battery_DATA.xml' }] }),
      });

      const fileId = await findFileInFolder(mockAccessToken, TARGET_FOLDER_ID, 'Battery_DATA.xml');

      expect(fileId).toBe('existing-file-123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`https://www.googleapis.com/drive/v3/files?pageSize=100`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should return null if file does not exist in target folder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      const fileId = await findFileInFolder(mockAccessToken, TARGET_FOLDER_ID, 'Battery_DATA.xml');

      expect(fileId).toBeNull();
    });
  });

  describe('downloadFileContent', () => {
    it('should download file content using alt=media parameter', async () => {
      const existingXml = '<?xml version="1.0"?><QRCodeScans></QRCodeScans>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => existingXml,
      });

      const content = await downloadFileContent(mockAccessToken, 'existing-file-123');

      expect(content).toBe(existingXml);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/drive/v3/files/existing-file-123?alt=media&supportsAllDrives=true',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });
  });

  describe('updateXmlFile', () => {
    it('should make multipart PATCH request to update file content and modifiedTime', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'existing-file-123', name: 'Battery_DATA.xml' }),
      });

      const updatedXml = '<?xml version="1.0"?><QRCodeScans><Scan></Scan></QRCodeScans>';
      const result = await updateXmlFile(mockAccessToken, 'existing-file-123', updatedXml);

      expect(result).toEqual({ fileId: 'existing-file-123', fileName: 'Battery_DATA.xml' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/upload/drive/v3/files/existing-file-123?uploadType=multipart&supportsAllDrives=true',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': expect.stringContaining('multipart/related; boundary='),
          }),
          body: expect.stringContaining(updatedXml),
        })
      );
    });
  });

  describe('uploadXmlFile', () => {
    it('should make multipart POST request with correct metadata and XML content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'file-id-abc', name: 'Battery_DATA.xml' }),
      });

      const folderId = 'folder-id-123';
      const fileName = 'Battery_DATA.xml';
      const xmlContent = '<?xml version="1.0" encoding="utf-8"?><QRCodeScans><Scan></Scan></QRCodeScans>';

      const result = await uploadXmlFile(mockAccessToken, folderId, fileName, xmlContent);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': expect.stringContaining('multipart/related; boundary='),
            Accept: 'application/json',
          }),
          body: expect.any(String),
        })
      );

      const fetchCallArgs = mockFetch.mock.calls[0];
      const bodyString = fetchCallArgs[1].body as string;

      expect(bodyString).toContain('Content-Type: application/json; charset=UTF-8');
      expect(bodyString).toContain(
        JSON.stringify({
          name: fileName,
          mimeType: 'application/xml',
          parents: [folderId],
        })
      );
      expect(bodyString).toContain('Content-Type: application/xml');
      expect(bodyString).toContain(xmlContent);
      expect(result).toEqual({ fileId: 'file-id-abc', fileName: 'Battery_DATA.xml' });
    });

    it('should throw an error if the multipart upload fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid metadata',
      });

      await expect(
        uploadXmlFile(mockAccessToken, 'folder-id', 'test.xml', '<xml></xml>')
      ).rejects.toThrow('Failed to upload XML file: 400 Bad Request - Invalid metadata');
    });
  });

  describe('syncScanToGoogleDrive', () => {
    it('should fetch existing Battery_DATA.xml, append new scan record, and PATCH updated file', async () => {
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      const existingXml = `<?xml version="1.0" encoding="utf-8"?>
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

      // 1. Search response: file exists
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [{ id: 'existing-file-123', name: 'Battery_DATA.xml' }] }),
      });

      // 2. Download content response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => existingXml,
      });

      // 3. Update PATCH response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'existing-file-123', name: 'Battery_DATA.xml' }),
      });

      const result = await syncScanToGoogleDrive('GE0588607', 'R12024007', '2025-08-13');

      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const patchCallArgs = mockFetch.mock.calls[2];
      const patchBody = patchCallArgs[1].body as string;
      expect(patchBody).toContain('<BatteryCode>GE0588927</BatteryCode>');
      expect(patchBody).toContain('<BatteryCode>GE0588607</BatteryCode>');
      expect(result).toEqual({ fileId: 'existing-file-123', fileName: 'Battery_DATA.xml' });
    });

    it('should create a new Battery_DATA.xml file via multipart POST if file does not exist', async () => {
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // 1. Search response: no file found
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      // 2. Multipart upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-uploaded-file-id', name: 'Battery_DATA.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20');

      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const postCallArgs = mockFetch.mock.calls[1];
      const bodyString = postCallArgs[1].body as string;
      expect(bodyString).toContain(
        JSON.stringify({
          name: 'Battery_DATA.xml',
          mimeType: 'application/xml',
          parents: [TARGET_FOLDER_ID],
        })
      );
      expect(result).toEqual({ fileId: 'new-uploaded-file-id', fileName: 'Battery_DATA.xml' });
    });

    it('should clear cached token, get a new one, and retry once on 401 Unauthorized during search/download/patch', async () => {
      const mockRefreshedToken = 'mock-refreshed-token-456';

      // First token call
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // Mock search failing with 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Token expired',
      });

      // Expected token refresh calls
      (GoogleOneTapSignIn.clearCachedAccessToken as jest.Mock).mockResolvedValueOnce(undefined);
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockRefreshedToken,
      });

      // Retried attempt:
      // 1. Search response: no file found
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      // 2. Multipart POST upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'uploaded-file-id', name: 'Battery_DATA.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20');

      expect(GoogleOneTapSignIn.clearCachedAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1. Failed search (401), 2. Retried search, 3. Upload
      expect(result).toEqual({ fileId: 'uploaded-file-id', fileName: 'Battery_DATA.xml' });
    });
  });
});


