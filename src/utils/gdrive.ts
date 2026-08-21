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
  const query = `name = '${fileName}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,parents,createdTime)&orderBy=createdTime%20desc`;

  console.log(`[GDrive Sync] Searching for file '${fileName}' in Google Drive...`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[GDrive Sync] Search failed: ${response.status} ${response.statusText} - ${errText}`);
    throw new Error(`Failed to search folder: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  const files: Array<{ id: string; name: string; parents?: string[] }> = data.files || [];
  console.log(`[GDrive Sync] Search found ${files.length} file(s) named '${fileName}'.`);

  if (files.length === 0) {
    return null;
  }

  // Find file in the specific target folder first
  const matchInFolder = files.find(f => f.parents && f.parents.includes(folderId));
  if (matchInFolder) {
    console.log(`[GDrive Sync] Found matching file in target folder '${folderId}', ID: ${matchInFolder.id}`);
    return matchInFolder.id;
  }

  // Fallback to the first matching file
  console.log(`[GDrive Sync] Using most recent file ID '${files[0].id}' (parents: ${JSON.stringify(files[0].parents)})`);
  return files[0].id;
}

/**
 * Downloads media content of a file from Google Drive.
 */
export async function downloadFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;

  console.log(`[GDrive Sync] Downloading content for file ID '${fileId}'...`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[GDrive Sync] Download failed: ${response.status} ${response.statusText} - ${errText}`);
    throw new Error(`Failed to download file content: ${response.status} ${response.statusText} - ${errText}`);
  }

  const text = await response.text();
  console.log(`[GDrive Sync] Downloaded XML content (${text.length} bytes).`);
  return text;
}

/**
 * Updates an existing file's media content in Google Drive using PATCH request.
 */
export async function updateXmlFile(
  accessToken: string,
  fileId: string,
  xmlContent: string
): Promise<UploadResult> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`;

  console.log(`[GDrive Sync] PATCH updating file ID '${fileId}' (${xmlContent.length} bytes)...`);
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
    console.error(`[GDrive Sync] Update failed: ${response.status} ${response.statusText} - ${errText}`);
    throw new Error(`Failed to update XML file: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  console.log(`[GDrive Sync] File PATCH update successful! File ID: ${data.id || fileId}`);
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
  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';
  const boundary = `-------314159265358979323846_${Date.now()}`;

  console.log(`[GDrive Sync] Creating new file '${fileName}' in folder '${folderId}' via multipart POST...`);
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
    console.error(`[GDrive Sync] Multipart upload failed: ${response.status} ${response.statusText} - ${errText}`);
    throw new Error(`Failed to upload XML file: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  console.log(`[GDrive Sync] New file created successfully! File ID: ${data.id}`);
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
      console.log(`[GDrive Sync] Found existing file '${fileName}' (ID: ${existingFileId}). Appending scan data...`);
      const existingXml = await downloadFileContent(token, existingFileId);
      const updatedXml = appendScanToXml(existingXml, {
        batteryCode,
        droneSerial,
        date,
      });
      return await updateXmlFile(token, existingFileId, updatedXml);
    } else {
      console.log(`[GDrive Sync] Existing file '${fileName}' not found. Creating new file...`);
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


