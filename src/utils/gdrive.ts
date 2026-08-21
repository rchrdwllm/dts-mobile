import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import { serializeScanRecord, appendScanToXml } from './xml';

export interface UploadResult {
  fileId: string;
  fileName: string;
}

export const TARGET_FOLDER_ID = process.env.EXPO_PUBLIC_GDRIVE_TARGET_FOLDER_ID || '1A2B3C4D5E6F7G8H9I0J';

/**
 * Searches for an existing file with given name in the target Google Drive folder.
 * Returns the fileId if found, or null if not found.
 */
export async function findFileInFolder(
  accessToken: string,
  folderId: string,
  fileName: string
): Promise<string | null> {
  const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

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
 * Downloads media content of a file from Google Drive.
 */
export async function downloadFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to download file content: ${response.status} ${response.statusText} - ${errText}`);
  }

  return await response.text();
}

/**
 * Updates an existing file's media content in Google Drive using PATCH request.
 */
export async function updateXmlFile(
  accessToken: string,
  fileId: string,
  xmlContent: string
): Promise<UploadResult> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/xml',
      'Accept': 'application/json',
    },
    body: xmlContent,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to update XML file: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return {
    fileId: data.id || fileId,
    fileName: data.name || 'Battery_DATA.xml',
  };
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
 * Checks for existing Battery_DATA.xml file, appends the new scan data, and updates the file (or creates it if not found).
 */
export async function syncScanToGoogleDrive(
  batteryCode: string,
  droneSerial: string,
  date?: string
): Promise<UploadResult> {
  let tokens = await GoogleOneTapSignIn.getTokens();
  let accessToken = tokens.accessToken;

  const performSync = async (token: string): Promise<UploadResult> => {
    const fileName = 'Battery_DATA.xml';
    
    const existingFileId = await findFileInFolder(token, TARGET_FOLDER_ID, fileName);

    if (existingFileId) {
      const existingXml = await downloadFileContent(token, existingFileId);
      const updatedXml = appendScanToXml(existingXml, {
        batteryCode,
        droneSerial,
        date,
      });
      return await updateXmlFile(token, existingFileId, updatedXml);
    } else {
      const xmlContent = serializeScanRecord({
        batteryCode,
        droneSerial,
        date,
      });
      return await uploadXmlFile(token, TARGET_FOLDER_ID, fileName, xmlContent);
    }
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


