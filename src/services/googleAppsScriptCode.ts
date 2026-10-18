/**
 * Kode Google Apps Script lengkap untuk backend Administrasi Guru Digital.
 * Siap disalin langsung ke Google Sheets -> Ekstensi -> Apps Script.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ADMINISTRASI GURU DIGITAL - BACKEND GOOGLE APPS SCRIPT
 * Timezone: Asia/Makassar (WITA)
 * Database: Google Spreadsheet & Google Drive
 */

const TIMEZONE = "Asia/Makassar";

// Daftar sheet dan header kolom
const SHEET_DEFINITIONS = {
  "Pengaturan": ["key", "value", "updated_at"],
  "Kelas": ["id", "name", "level", "homeroomTeacher", "updated_at"],
  "Jam_Pelajaran": ["period", "name", "startTime", "endTime", "updated_at"],
  "Data_Murid": ["id", "nis", "nisn", "name", "gender", "classId", "academicYear", "isActive", "updated_at"],
  "Jadwal_Mengajar": ["id", "day", "classId", "subject", "periodStart", "periodEnd", "startTime", "endTime", "room", "notes", "updated_at"],
  "Absensi": ["id", "date", "classId", "subject", "period", "studentId", "studentName", "status", "notes", "academicYear", "semester", "updated_at"],
  "Jurnal_Mengajar": ["id", "date", "day", "classId", "subject", "periodStart", "periodEnd", "topic", "learningObjective", "activities", "method", "results", "obstacles", "reflection", "followUp", "driveLink", "academicYear", "semester", "updated_at"],
  "Nilai_Pengetahuan": ["id", "date", "classId", "subject", "topic", "assessmentType", "studentId", "studentName", "score", "notes", "academicYear", "semester", "updated_at"],
  "Nilai_Keterampilan": ["id", "date", "classId", "subject", "topic", "practiceType", "studentId", "studentName", "indicators_json", "finalScore", "notes", "feedback", "academicYear", "semester", "updated_at"],
  "Nilai_Sikap": ["id", "date", "classId", "subject", "studentId", "studentName", "scores_json", "behaviorNotes", "observationDate", "resultSummary", "academicYear", "semester", "updated_at"],
  "Indikator_Penilaian": ["id", "category", "name", "weight", "description", "updated_at"],
  "Jurnal_Pendampingan": ["id", "journalNumber", "date", "studentId", "studentName", "classId", "problemType", "problemDescription", "identificationResult", "mentoringSteps", "mutualAgreement", "followUp", "status", "nextEvaluationDate", "mentorTeacher", "teacherSignature", "studentSignature", "updated_at"],
  "Kartu_Refleksi": ["id", "date", "classId", "studentId", "studentName", "topic", "understood", "difficulties", "interestingParts", "improvements", "emotion", "teacherNotes", "followUp", "academicYear", "semester", "updated_at"]
};

/**
 * Jalankan fungsi ini SATU KALI untuk menginisialisasi seluruh sheet & header otomatis.
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TIMEZONE);
  
  for (const sheetName in SHEET_DEFINITIONS) {
    let sheet = ss.getSheetByName(sheetName);
    const headers = SHEET_DEFINITIONS[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Periksa apakah baris pertama sudah ada
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    } else {
      // Pastikan header sesuai
      const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      let mismatch = false;
      for (let i = 0; i < headers.length; i++) {
        if (currentHeaders[i] !== headers[i]) {
          mismatch = true;
          break;
        }
      }
      if (mismatch) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }
    
    // Format Header (Navy Blue #1E3A8A, Teks Putih Tebal, Freeze Baris 1)
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1E3A8A");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  
  // Isi data default Jam_Pelajaran jika masih kosong
  const jamSheet = ss.getSheetByName("Jam_Pelajaran");
  if (jamSheet.getLastRow() <= 1) {
    const defaultPeriods = [
      [0, "Jam 0 (Upacara / Literasi)", "07:00", "07:30", new Date().toISOString()],
      [1, "Jam Ke-1", "07:30", "08:15", new Date().toISOString()],
      [2, "Jam Ke-2", "08:15", "09:00", new Date().toISOString()],
      [3, "Jam Ke-3", "09:00", "09:45", new Date().toISOString()],
      [4, "Jam Ke-4", "10:00", "10:45", new Date().toISOString()],
      [5, "Jam Ke-5", "10:45", "11:30", new Date().toISOString()],
      [6, "Jam Ke-6", "11:30", "12:15", new Date().toISOString()],
      [7, "Jam Ke-7", "12:45", "13:30", new Date().toISOString()],
      [8, "Jam Ke-8", "13:30", "14:15", new Date().toISOString()],
      [9, "Jam Ke-9", "14:15", "15:00", new Date().toISOString()],
      [10, "Jam Ke-10", "15:00", "15:45", new Date().toISOString()]
    ];
    jamSheet.getRange(2, 1, defaultPeriods.length, defaultPeriods[0].length).setValues(defaultPeriods);
  }

  // Hapus "Sheet1" bawaan jika ada dan kosong
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }
  
  Logger.log("Inisialisasi Spreadsheet Berhasil!");
  return { status: "success", message: "Inisialisasi spreadsheet berhasil disiapkan." };
}

/**
 * Handle HTTP GET Requests: Mengambil data sheet
 */
function doGet(e) {
  try {
    const action = e.parameter.action || "ping";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        message: "Administrasi Guru Digital API Aktif!",
        timestamp: new Date().toISOString(),
        timezone: TIMEZONE
      });
    }
    
    if (action === "getAllData") {
      const allData = {};
      for (const sheetName in SHEET_DEFINITIONS) {
        allData[sheetName] = readSheetRecords(ss, sheetName);
      }
      return jsonResponse({ status: "success", data: allData });
    }
    
    if (action === "getSheet") {
      const sheetName = e.parameter.sheet;
      if (!SHEET_DEFINITIONS[sheetName]) {
        return jsonResponse({ status: "error", message: "Sheet tidak dikenal: " + sheetName }, 400);
      }
      const data = readSheetRecords(ss, sheetName);
      return jsonResponse({ status: "success", sheet: sheetName, data: data });
    }
    
    return jsonResponse({ status: "error", message: "Action tidak valid" }, 400);
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() }, 500);
  }
}

/**
 * Handle HTTP POST Requests: Menyimpan data (Insert, Update, Batch, Upload Tanda Tangan)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Kunci proses penulisan selama maksimal 30 detik untuk menghindari race condition
    lock.waitLock(30000);
    
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "setupSheets") {
      const res = setupSpreadsheet();
      return jsonResponse(res);
    }
    
    if (action === "saveRow") {
      const sheetName = postData.sheet;
      const rowData = postData.data;
      if (!SHEET_DEFINITIONS[sheetName]) {
        return jsonResponse({ status: "error", message: "Sheet tidak valid" }, 400);
      }
      const saved = upsertSingleRow(ss, sheetName, rowData);
      return jsonResponse({ status: "success", message: "Data berhasil disimpan", id: saved.id });
    }
    
    if (action === "batchSave") {
      const sheetName = postData.sheet;
      const rows = postData.data; // Array of objects
      if (!SHEET_DEFINITIONS[sheetName] || !Array.isArray(rows)) {
        return jsonResponse({ status: "error", message: "Payload batch tidak valid" }, 400);
      }
      batchUpsertRows(ss, sheetName, rows);
      return jsonResponse({ status: "success", message: rows.length + " data berhasil disimpan" });
    }
    
    if (action === "deleteRow") {
      const sheetName = postData.sheet;
      const id = postData.id;
      const deleted = deleteRowById(ss, sheetName, id);
      return jsonResponse({ status: "success", message: deleted ? "Data berhasil dihapus" : "Data tidak ditemukan" });
    }
    
    if (action === "uploadSignature") {
      const base64Data = postData.base64; // Data URL format atau pure base64
      const folderId = postData.folderId;
      const filename = postData.filename || ("TTD_" + new Date().getTime() + ".png");
      
      const fileUrl = saveBase64ImageToDrive(base64Data, filename, folderId);
      return jsonResponse({ status: "success", url: fileUrl });
    }
    
    return jsonResponse({ status: "error", message: "Action POST tidak valid" }, 400);
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Membaca seluruh baris dari sheet dan mengembalikannya sebagai array of objects
 */
function readSheetRecords(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  const records = [];
  for (let r = 0; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      let val = row[c];
      // Parsing string JSON untuk kolom bertanda _json
      if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[key] = val;
    }
    records.push(obj);
  }
  return records;
}

/**
 * Menyimpan atau memperbarui 1 baris berdasarkan kolom 'id' atau 'key'
 */
function upsertSingleRow(ss, sheetName, rowData) {
  const sheet = ss.getSheetByName(sheetName);
  const headers = SHEET_DEFINITIONS[sheetName];
  const lastRow = sheet.getLastRow();
  const idKey = headers[0]; // Biasanya 'id' atau 'key'
  const targetId = String(rowData[idKey]);
  
  rowData.updated_at = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  
  // Susun nilai sesuai urutan header
  const rowValues = headers.map(h => {
    let val = rowData[h];
    if (val === undefined || val === null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return val;
  });
  
  let targetRowIndex = -1;
  if (lastRow > 1) {
    const idList = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < idList.length; i++) {
      if (String(idList[i][0]) === targetId) {
        targetRowIndex = i + 2;
        break;
      }
    }
  }
  
  if (targetRowIndex > -1) {
    sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  return { id: targetId };
}

/**
 * Menyimpan banyak baris secara batch untuk kecepatan tinggi
 */
function batchUpsertRows(ss, sheetName, rows) {
  const sheet = ss.getSheetByName(sheetName);
  const headers = SHEET_DEFINITIONS[sheetName];
  const lastRow = sheet.getLastRow();
  const idKey = headers[0];
  
  const nowStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  
  // Baca ID yang sudah ada
  const existingMap = {};
  if (lastRow > 1) {
    const idList = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < idList.length; i++) {
      existingMap[String(idList[i][0])] = i + 2;
    }
  }
  
  const toAppend = [];
  
  for (let r = 0; r < rows.length; r++) {
    const item = rows[r];
    item.updated_at = nowStr;
    const targetId = String(item[idKey]);
    
    const rowValues = headers.map(h => {
      let val = item[h];
      if (val === undefined || val === null) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    });
    
    if (existingMap[targetId]) {
      const rowIndex = existingMap[targetId];
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
    } else {
      toAppend.push(rowValues);
    }
  }
  
  if (toAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, headers.length).setValues(toAppend);
  }
}

/**
 * Menghapus baris berdasarkan ID
 */
function deleteRowById(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  const idList = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idList.length; i++) {
    if (String(idList[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

/**
 * Menyimpan data Base64 gambar Tanda Tangan ke Google Drive
 */
function saveBase64ImageToDrive(base64Data, filename, folderId) {
  let cleanBase64 = base64Data;
  if (base64Data.indexOf(",") > -1) {
    cleanBase64 = base64Data.split(",")[1];
  }
  
  const decoded = Utilities.base64Decode(cleanBase64);
  const blob = Utilities.newBlob(decoded, "image/png", filename);
  
  let folder;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
  } else {
    // Buat atau gunakan folder "Administrasi_Guru_Digital" di root Drive
    const folders = DriveApp.getFoldersByName("Administrasi_Guru_Digital");
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder("Administrasi_Guru_Digital");
    }
  }
  
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/**
 * Helper JSON Response
 */
function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
