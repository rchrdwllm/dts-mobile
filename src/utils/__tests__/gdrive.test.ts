import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import {
  findFolder,
  createFolder,
  uploadXmlFile,
  syncScanToGoogleDrive,
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

  describe('findFolder', () => {
    it('should query files API and return the folder ID if the folder is found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: 'folder-id-999', name: 'QRScannerGDrive' }],
        }),
      });

      const folderId = await findFolder(mockAccessToken, 'QRScannerGDrive');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("name%20%3D%20'QRScannerGDrive'"),
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            Accept: 'application/json',
          },
        })
      );
      expect(folderId).toBe('folder-id-999');
    });

    it('should return null if no matching folder is found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      const folderId = await findFolder(mockAccessToken, 'QRScannerGDrive');
      expect(folderId).toBeNull();
    });

    it('should throw an error if the search request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Database error',
      });

      await expect(findFolder(mockAccessToken, 'QRScannerGDrive')).rejects.toThrow(
        'Failed to search folder: 500 Internal Server Error - Database error'
      );
    });
  });

  describe('createFolder', () => {
    it('should make POST request to create the folder and return the new ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-folder-id' }),
      });

      const folderId = await createFolder(mockAccessToken, 'QRScannerGDrive');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/drive/v3/files',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: 'QRScannerGDrive',
            mimeType: 'application/vnd.google-apps.folder',
          }),
        })
      );
      expect(folderId).toBe('new-folder-id');
    });

    it('should throw an error if folder creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Quota exceeded',
      });

      await expect(createFolder(mockAccessToken, 'QRScannerGDrive')).rejects.toThrow(
        'Failed to create folder: 403 Forbidden - Quota exceeded'
      );
    });
  });

  describe('uploadXmlFile', () => {
    it('should make multipart POST request with correct metadata and XML content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'file-id-abc', name: 'Scan_TEST.xml' }),
      });

      const folderId = 'folder-id-123';
      const fileName = 'Scan_TEST.xml';
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
      expect(result).toEqual({ fileId: 'file-id-abc', fileName: 'Scan_TEST.xml' });
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
    it('should check folder, find it, and upload file directly', async () => {
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // Mock search folder: returns existing folder id
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: 'existing-folder-id', name: 'QRScannerGDrive' }],
        }),
      });

      // Mock file upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'uploaded-file-id', name: 'Scan_BATCH123_2026.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20T23:55:00.000Z');

      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1. findFolder, 2. uploadXmlFile
      expect(result).toEqual({ fileId: 'uploaded-file-id', fileName: 'Scan_BATCH123_2026.xml' });
    });

    it('should check folder, not find it, create it, and then upload file', async () => {
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // Mock search folder: returns no files
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      // Mock folder creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'created-folder-id' }),
      });

      // Mock file upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'uploaded-file-id', name: 'Scan_BATCH123_2026.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20T23:55:00.000Z');

      expect(mockFetch).toHaveBeenCalledTimes(3); // 1. findFolder, 2. createFolder, 3. uploadXmlFile
      expect(result).toEqual({ fileId: 'uploaded-file-id', fileName: 'Scan_BATCH123_2026.xml' });
    });

    it('should clear cached token, get a new one, and retry once on 401 Unauthorized', async () => {
      const mockRefreshedToken = 'mock-refreshed-token-456';

      // First token call
      (GoogleOneTapSignIn.getTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
      });

      // Mock search folder failing with 401
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

      // Mock retried search folder succeeding (finding folder)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: 'existing-folder-id', name: 'QRScannerGDrive' }],
        }),
      });

      // Mock file upload succeeding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'uploaded-file-id', name: 'Scan_BATCH123_2026.xml' }),
      });

      const result = await syncScanToGoogleDrive('BATCH123', 'QR-DATA-XYZ', '2026-08-20T23:55:00.000Z');

      expect(GoogleOneTapSignIn.clearCachedAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(GoogleOneTapSignIn.getTokens).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1. First findFolder (401), 2. Retried findFolder, 3. uploadXmlFile
      expect(result).toEqual({ fileId: 'uploaded-file-id', fileName: 'Scan_BATCH123_2026.xml' });
    });
  });
});
