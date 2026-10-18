/**
 * Client API untuk komunikasi dengan Google Apps Script Web App
 */

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  id?: string;
  url?: string;
}

export async function pingAppsScript(url: string): Promise<ApiResponse> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return { status: 'error', message: 'URL Google Apps Script tidak valid. Harus diawali https://script.google.com/' };
  }

  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return { status: 'error', message: `Server mengembalikan status HTTP ${res.status}` };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { 
      status: 'error', 
      message: err.message || 'Gagal terhubung ke Google Apps Script. Pastikan Web App di-deploy dengan akses "Anyone".' 
    };
  }
}

export async function runSetupSpreadsheetRemote(url: string): Promise<ApiResponse> {
  return postToAppsScript(url, { action: 'setupSheets' });
}

export async function saveRowRemote(url: string, sheet: string, data: any): Promise<ApiResponse> {
  return postToAppsScript(url, {
    action: 'saveRow',
    sheet,
    data,
  });
}

export async function batchSaveRowsRemote(url: string, sheet: string, data: any[]): Promise<ApiResponse> {
  return postToAppsScript(url, {
    action: 'batchSave',
    sheet,
    data,
  });
}

export async function deleteRowRemote(url: string, sheet: string, id: string): Promise<ApiResponse> {
  return postToAppsScript(url, {
    action: 'deleteRow',
    sheet,
    id,
  });
}

export async function uploadSignatureRemote(
  url: string,
  base64Data: string,
  filename: string,
  folderId?: string
): Promise<ApiResponse> {
  return postToAppsScript(url, {
    action: 'uploadSignature',
    base64: base64Data,
    filename,
    folderId: folderId || '',
  });
}

export async function fetchAllRemoteData(url: string): Promise<ApiResponse<Record<string, any[]>>> {
  if (!url) return { status: 'error', message: 'URL belum dikonfigurasi' };
  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=getAllData&_t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { status: 'error', message: err.message || 'Gagal mengambil data dari Google Spreadsheet' };
  }
}

/**
 * Helper untuk mengirim POST payload ke Google Apps Script Web App
 */
async function postToAppsScript(url: string, payload: any): Promise<ApiResponse> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return { status: 'error', message: 'URL Google Apps Script belum valid.' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script menangani text/plain tanpa CORS preflight OPTIONS issue
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error posting to Apps Script:', err);
    return {
      status: 'error',
      message: err.message || 'Gagal menyimpan ke Google Spreadsheet. Silakan periksa koneksi atau URL Web App.',
    };
  }
}
