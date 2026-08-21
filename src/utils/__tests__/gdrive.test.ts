import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import {
  uploadXmlFile,
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

  describe('uploadXmlFile', () => {
    it('should make multipart POST request with correct metadata and XML content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'file-id-abc', name: 'Battery_DATA.xml' }),
      });

      const folderId = 'folder-id-123';
      const fileName = 'Battery_DATA.xml';
      const xmlContent = '<ScanRecord><Content></Content></ScanRecord>';

      const result = await uploadXmlFile(mockAccessToken, folderId, fileName, xmlContent);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
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

      // Verify multipart body syntax
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
    it('should upload Battery_DATA.xml directly to TARGET_FOLDER_ID', async () => {
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // Mock file upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'uploaded-file-id', name: 'Battery_DATA.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20T23:55:00.000Z');

      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const fetchCallArgs = mockFetch.mock.calls[0];
      const bodyString = fetchCallArgs[1].body as string;
      expect(bodyString).toContain(
        JSON.stringify({
          name: 'Battery_DATA.xml',
          mimeType: 'application/xml',
          parents: [TARGET_FOLDER_ID],
        })
      );
      expect(result).toEqual({ fileId: 'uploaded-file-id', fileName: 'Battery_DATA.xml' });
    });

    it('should clear cached token, get a new one, and retry once on 401 Unauthorized', async () => {
      const mockRefreshedToken = 'mock-refreshed-token-456';

      // First token call
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // Mock upload failing with 401
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

      // Mock retried upload succeeding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'uploaded-file-id', name: 'Battery_DATA.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20T23:55:00.000Z');

      expect(GoogleOneTapSignIn.clearCachedAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1. Failed upload (401), 2. Retried upload
      expect(result).toEqual({ fileId: 'uploaded-file-id', fileName: 'Battery_DATA.xml' });
    });
  });
});

