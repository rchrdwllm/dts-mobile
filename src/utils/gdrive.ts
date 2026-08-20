import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import { serializeScanRecord } from './xml';

export interface UploadResult {
  fileId: string;
  fileName: string;
}

/**
 * Searches for a folder with the given name on Google Drive.
 * Returns the folder ID if found, or null otherwise.
 */
export async function findFolder(accessToken: string, folderName: string): Promise<string | null> {
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&spaces=drive&fields=files(id,name)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to search folder: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Creates a folder with the given name on Google Drive.
 * Returns the new folder's ID.
 */
export async function createFolder(accessToken: string, folderName: string): Promise<string> {
  const url = 'https://www.googleapis.com/drive/v3/files';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create folder: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Uploads an XML payload to Google Drive using multipart upload protocol.
 * Returns the uploaded file's metadata.
 */
export async function uploadXmlFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  xmlContent: string
): Promise<UploadResult> {
  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const boundary = `-------314159265358979323846_${Date.now()}`;

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({
      name: fileName,
      mimeType: 'application/xml',
      parents: [folderId],
    }),
    `--${boundary}`,
    'Content-Type: application/xml',
    '',
    xmlContent,
    `--${boundary}--`,
  ].join('\r\n');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Accept': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload XML file: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    fileName: data.name,
  };
}

/**
 * High-level function to sync scan record to Google Drive.
 * Retrieves tokens, checks/creates folder, serializes XML, uploads, and handles token expiration.
 */
export async function syncScanToGoogleDrive(
  inputNumber: string,
  qrCodeData: string,
  timestamp?: string
): Promise<UploadResult> {
  const folderName = 'QRScannerGDrive';
  let tokens = await GoogleOneTapSignIn.getTokens();
  let accessToken = tokens.accessToken;

  const performSync = async (token: string): Promise<UploadResult> => {
    let folderId = await findFolder(token, folderName);
    if (!folderId) {
      folderId = await createFolder(token, folderName);
    }

    const currentTimestamp = timestamp || new Date().toISOString();
    const fileName = `Scan_${inputNumber}_${currentTimestamp}.xml`;
    
    const xmlContent = serializeScanRecord({
      inputNumber,
      qrCodeData,
      timestamp: currentTimestamp,
    });

    return uploadXmlFile(token, folderId, fileName, xmlContent);
  };

  try {
    return await performSync(accessToken);
  } catch (error) {
    const isUnauthorized = error instanceof Error && 
      (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized'));
    
    if (isUnauthorized) {
      console.log('[GDrive Sync] Unauthorized error, clearing cached access token and retrying...');
      try {
        await GoogleOneTapSignIn.clearCachedAccessToken(accessToken);
        const newTokens = await GoogleOneTapSignIn.getTokens();
        return await performSync(newTokens.accessToken);
      } catch (retryError) {
        console.error('[GDrive Sync] Retry failed:', retryError);
        throw retryError;
      }
    }
    throw error;
  }
}
