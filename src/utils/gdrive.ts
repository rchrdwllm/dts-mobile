import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import { appendScanToXml, serializeScanRecord } from './xml';

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
  const query = encodeURIComponent(`'${folderId}' in parents and name = '${fileName}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,parents,createdTime,modifiedTime,size,trashed)&orderBy=modifiedTime%20desc`;

  console.log(`[GDrive Sync] Searching strictly inside folder '${folderId}' for '${fileName}'...`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[GDrive Sync] Search in folder failed: ${response.status} ${response.statusText} - ${errText}`);
    throw new Error(`Failed to search files in folder: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  const files: { id: string; name: string; parents?: string[]; size?: string; createdTime?: string; modifiedTime?: string; trashed?: boolean }[] = data.files || [];
  
  console.log(`[GDrive Sync] Found ${files.length} matching file(s) in target folder '${folderId}':`, 
    files.map(f => ({ id: f.id, name: f.name, parents: f.parents, size: f.size, modifiedTime: f.modifiedTime }))
  );

  if (files.length === 0) {
    return null;
  }

  // Sort candidate files in target folder: largest file size first, then most recently modified
  files.sort((a, b) => {
    const sizeA = parseInt(a.size || '0', 10);
    const sizeB = parseInt(b.size || '0', 10);
    if (sizeA !== sizeB) {
      return sizeB - sizeA;
    }
    const timeA = new Date(a.modifiedTime || a.createdTime || 0).getTime();
    const timeB = new Date(b.modifiedTime || b.createdTime || 0).getTime();
    return timeB - timeA;
  });

  const keeperFile = files[0];
  console.log(`[GDrive Sync] Selected keeper file in target folder: ID=${keeperFile.id}, size=${keeperFile.size ?? '0'} bytes`);

  // Clean up smaller duplicate files in target folder if any exist
  if (files.length > 1) {
    const duplicatesToDelete = files.slice(1);
    console.log(`[GDrive Sync] Cleaning up ${duplicatesToDelete.length} duplicate file(s) in target folder...`);
    for (const dup of duplicatesToDelete) {
      try {
        console.log(`[GDrive Sync] Deleting duplicate file ID '${dup.id}' (size: ${dup.size ?? '0'} bytes)...`);
        await fetch(`https://www.googleapis.com/drive/v3/files/${dup.id}?supportsAllDrives=true`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (delErr) {
        console.warn(`[GDrive Sync] Failed to delete duplicate file ${dup.id}:`, delErr);
      }
    }
  }

  return keeperFile.id;
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
 * Updates an existing file's media content in Google Drive using media PATCH request.
 */
export async function updateXmlFile(
  accessToken: string,
  fileId: string,
  xmlContent: string
): Promise<UploadResult> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`;

  console.log(`[GDrive Sync] Media PATCH updating file ID '${fileId}' (${xmlContent.length} bytes)...`);
  console.log('[GDrive Sync] End snippet of payload to upload:\n', xmlContent.slice(-300));

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
  const finalId = data.id || fileId;
  console.log(`[GDrive Sync] File media PATCH update successful! File ID: ${finalId}`);
  console.log(`[GDrive Sync] View file in browser: https://drive.google.com/file/d/${finalId}/view`);

  // Update modifiedTime metadata to force Drive Web UI preview refresh
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${finalId}?supportsAllDrives=true`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modifiedTime: new Date().toISOString() }),
    });
  } catch (modErr) {
    console.warn('[GDrive Sync] Optional modifiedTime update failed:', modErr);
  }

  return {
    fileId: finalId,
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
 * @param batteryCode - Scanned QR code payload (Battery Serial No.)
 * @param droneSerial - User text input (Drone Serial No.)
 * @param date - Optional date string YYYY-MM-DD
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