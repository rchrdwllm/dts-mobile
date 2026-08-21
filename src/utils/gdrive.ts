import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import { serializeScanRecord } from './xml';

export interface UploadResult {
  fileId: string;
  fileName: string;
}

export const TARGET_FOLDER_ID = process.env.EXPO_PUBLIC_GDRIVE_TARGET_FOLDER_ID || '1A2B3C4D5E6F7G8H9I0J';

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
 * Retrieves tokens, serializes XML, uploads directly to target folder as Battery_DATA.xml, and handles token expiration.
 */
export async function syncScanToGoogleDrive(
  inputNumber: string,
  qrCodeData: string,
  timestamp?: string
): Promise<UploadResult> {
  let tokens = await GoogleOneTapSignIn.getTokens();
  let accessToken = tokens.accessToken;

  const performSync = async (token: string): Promise<UploadResult> => {
    const currentTimestamp = timestamp || new Date().toISOString();
    const fileName = 'Battery_DATA.xml';
    
    const xmlContent = serializeScanRecord({
      inputNumber,
      qrCodeData,
      timestamp: currentTimestamp,
    });

    return uploadXmlFile(token, TARGET_FOLDER_ID, fileName, xmlContent);
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

