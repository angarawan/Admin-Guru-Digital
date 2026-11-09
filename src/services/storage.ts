import {
  AppSettings,
  ClassItem,
  PeriodTime,
  Student,
  ScheduleItem,
  AttendanceRecord,
  TeachingJournal,
  KnowledgeAssessment,
  SkillAssessment,
  AttitudeAssessment,
  MentoringJournal,
  ReflectionCard,
} from '../types';

import {
  DEFAULT_SETTINGS,
  DEFAULT_PERIODS,
  DEFAULT_CLASSES,
  DEFAULT_STUDENTS,
  DEFAULT_SCHEDULE,
  DEFAULT_ATTENDANCE,
  DEFAULT_JOURNALS,
  DEFAULT_KNOWLEDGE_ASSESSMENTS,
  DEFAULT_SKILL_ASSESSMENTS,
  DEFAULT_ATTITUDE_ASSESSMENTS,
  DEFAULT_MENTORING_JOURNALS,
  DEFAULT_REFLECTIONS,
} from './initialData';

import {
  saveRowRemote,
  batchSaveRowsRemote,
  deleteRowRemote,
  fetchAllRemoteData,
} from './api';

const STORAGE_KEYS = {
  SETTINGS: 'agd_settings',
  CLASSES: 'agd_classes',
  PERIODS: 'agd_periods',
  STUDENTS: 'agd_students',
  SCHEDULES: 'agd_schedules',
  ATTENDANCE: 'agd_attendance',
  JOURNALS: 'agd_journals',
  KNOWLEDGE: 'agd_knowledge',
  SKILLS: 'agd_skills',
  ATTITUDES: 'agd_attitudes',
  MENTORING: 'agd_mentoring',
  REFLECTIONS: 'agd_reflections',
  LAST_SYNC: 'agd_last_sync',
};

// Listener callbacks for storage updates
type SyncListener = (status: {
  isSyncing: boolean;
  statusText: string;
  isError: boolean;
  lastSyncTime?: string;
}) => void;

let syncListeners: SyncListener[] = [];

export function subscribeSyncStatus(listener: SyncListener): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

function notifySync(status: {
  isSyncing: boolean;
  statusText: string;
  isError: boolean;
  lastSyncTime?: string;
}) {
  syncListeners.forEach((l) => l(status));
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------
export function getSettings(): AppSettings {
  const stored = getStored<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const merged = { ...DEFAULT_SETTINGS, ...stored };
  if (merged.subject === 'Matematika') {
    merged.subject = 'PJOK';
    setStored(STORAGE_KEYS.SETTINGS, merged);
  }
  return merged;
}

export async function saveSettings(settings: AppSettings): Promise<{ success: boolean; message?: string }> {
  setStored(STORAGE_KEYS.SETTINGS, settings);
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan Pengaturan ke Google Spreadsheet...', isError: false });
    const res = await saveRowRemote(settings.appsScriptUrl, 'Pengaturan', {
      id: 'settings_config',
      ...settings,
    });
    if (res.status === 'success') {
      notifySync({
        isSyncing: false,
        statusText: 'Tersimpan Permanen di Google Spreadsheet',
        isError: false,
        lastSyncTime: new Date().toLocaleTimeString('id-ID'),
      });
      return { success: true, message: 'Pengaturan tersimpan ke Google Spreadsheet' };
    } else {
      notifySync({
        isSyncing: false,
        statusText: res.message || 'Gagal sinkron ke Spreadsheet',
        isError: true,
      });
      return { success: false, message: res.message };
    }
  } else {
    notifySync({
      isSyncing: false,
      statusText: 'Tersimpan secara lokal (Apps Script belum disetel)',
      isError: false,
    });
    return { success: true, message: 'Tersimpan di memori browser' };
  }
}

// -------------------------------------------------------------
// NORMALIZATION HELPERS FOR SPREADSHEETS & MANUAL ENTRIES
// -------------------------------------------------------------

/**
 * Normalizes class identifiers for fuzzy matching across spaces, hyphens, prefixes, and casing
 * (e.g. "XI 1", "XI-1", "xi-1", "cls-xi-1", "Kelas XI 1" -> "xi1")
 */
export function normalizeClassKey(str: string | undefined | null): string {
  if (!str) return '';
  let s = String(str).trim().toLowerCase();
  s = s.replace(/^cls[-_]/, ''); // remove cls- prefix
  s = s.replace(/^kelas\s*/, ''); // remove 'kelas' prefix
  s = s.replace(/[^a-z0-9]/g, ''); // strip all non-alphanumeric (hyphens, spaces, dots)
  return s;
}

/**
 * Normalizes raw class objects from Google Spreadsheet, manual input, or CSV
 * Supports common Indonesian headers: "Nama Kelas", "Kelas", "Rombel", "Tingkat", "Wali Kelas", "No"
 */
export function normalizeClassItem(raw: any, index: number = 0): ClassItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `cls-${index + 1}`,
      name: `Kelas ${index + 1}`,
      level: 'X',
    };
  }

  // 1. Extract Name
  const rawName =
    raw.name ||
    raw['Nama Kelas'] ||
    raw['Nama_Kelas'] ||
    raw['nama_kelas'] ||
    raw['Kelas'] ||
    raw['kelas'] ||
    raw['Rombel'] ||
    raw['rombel'] ||
    raw['Rombongan Belajar'] ||
    raw['Nama'] ||
    raw['nama'] ||
    raw['ID'] ||
    raw.id ||
    `Kelas ${index + 1}`;

  const name = String(rawName).trim();

  // 2. Extract or Generate ID
  let id = raw.id || raw['id'] || raw['ID'] || raw['Kode'] || raw['kode'] || raw['Kode Kelas'];
  if (!id || typeof id !== 'string' || !id.trim() || id === 'undefined' || id === 'null') {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    id = slug ? `cls-${slug}` : `cls-${index + 1}`;
  } else {
    id = String(id).trim();
  }

  // 3. Extract Level (Tingkat)
  let level = raw.level || raw['level'] || raw['Level'] || raw['Tingkat'] || raw['tingkat'] || raw['Tingkat Kelas'] || raw['Jenjang'];
  if (!level || typeof level !== 'string' || !level.trim()) {
    const upper = name.toUpperCase();
    if (upper.startsWith('XII') || upper.includes('12')) {
      level = 'XII';
    } else if (upper.startsWith('XI') || upper.includes('11')) {
      level = 'XI';
    } else {
      level = 'X';
    }
  } else {
    level = String(level).trim().toUpperCase();
    if (level === '10') level = 'X';
    if (level === '11') level = 'XI';
    if (level === '12') level = 'XII';
  }

  // 4. Extract Homeroom Teacher (Wali Kelas)
  const homeroomTeacher =
    raw.homeroomTeacher ||
    raw['homeroomTeacher'] ||
    raw['Wali Kelas'] ||
    raw['wali_kelas'] ||
    raw['Wali'] ||
    raw['wali'] ||
    raw['Guru Wali'] ||
    undefined;

  return {
    id,
    name,
    level,
    homeroomTeacher: homeroomTeacher ? String(homeroomTeacher).trim() : undefined,
  };
}

/**
 * Finds a matching class from a list using exact ID, exact Name, or fuzzy normalized key
 */
export function findMatchingClass(identifier: string | undefined | null, classes: ClassItem[]): ClassItem | undefined {
  if (!identifier || classes.length === 0) return undefined;
  const raw = String(identifier).trim();
  const rawLower = raw.toLowerCase();
  const norm = normalizeClassKey(raw);

  // 1. Exact ID
  const byId = classes.find((c) => c.id === raw);
  if (byId) return byId;

  // 2. Exact Name
  const byName = classes.find((c) => c.name.toLowerCase() === rawLower);
  if (byName) return byName;

  // 3. Normalized ID or Name Match
  const byNorm = classes.find((c) => normalizeClassKey(c.id) === norm || normalizeClassKey(c.name) === norm);
  if (byNorm) return byNorm;

  // 4. Legacy Demo mappings
  const legacyMap: Record<string, string> = {
    'xa': 'cls-1',
    'xb': 'cls-2',
    'ximipa1': 'cls-3',
    'ximipa2': 'cls-4',
    'xiimipa1': 'cls-5',
    'x1': 'cls-1',
    'x2': 'cls-2',
    'xi1': 'cls-3',
    'xi2': 'cls-4',
    'xii1': 'cls-5',
  };
  const legacyTargetId = legacyMap[norm];
  if (legacyTargetId) {
    const legacyFound = classes.find((c) => c.id === legacyTargetId || normalizeClassKey(c.id) === normalizeClassKey(legacyTargetId));
    if (legacyFound) return legacyFound;
  }

  return undefined;
}

/**
 * Normalizes raw student objects from Google Spreadsheet, manual input, or CSV
 * Guarantees a unique student ID, valid name, and correct class linkage
 */
export function normalizeStudentItem(raw: any, classes: ClassItem[], index: number = 0): Student {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `std-${Date.now()}-${index}`,
      nis: '',
      nisn: '',
      name: `Murid ${index + 1}`,
      gender: 'L',
      classId: classes[0]?.id || 'cls-1',
      academicYear: '2024/2025',
      isActive: true,
    };
  }

  const rawNis = String(raw.nis || raw['NIS'] || raw['nis'] || raw['Nomor Induk'] || raw['No. Induk'] || '').trim();
  const rawNisn = String(raw.nisn || raw['NISN'] || raw['nisn'] || '').trim();
  const rawName = String(
    raw.name ||
    raw['Nama'] ||
    raw['Nama Murid'] ||
    raw['Nama Siswa'] ||
    raw['Nama Lengkap'] ||
    raw['nama'] ||
    ''
  ).trim();

  // Guarantee unique, non-empty student ID so multiple students NEVER share an undefined or duplicate ID
  let id = raw.id || raw['id'] || raw['ID'];
  if (!id || typeof id !== 'string' || !id.trim() || id === 'undefined' || id === 'null') {
    if (rawNis) {
      id = `std-${rawNis}`;
    } else if (rawName) {
      const slug = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
      id = `std-${slug}-${index + 1}`;
    } else {
      id = `std-${Date.now()}-${index + 1}`;
    }
  } else {
    id = String(id).trim();
  }

  const rawGender = String(raw.gender || raw['Jenis Kelamin'] || raw['JK'] || raw['jk'] || raw['gender'] || 'L').trim().toUpperCase();
  const gender: 'L' | 'P' = rawGender.startsWith('P') ? 'P' : 'L';

  const rawClass = String(
    raw.classId ||
    raw['classId'] ||
    raw['Kelas'] ||
    raw['kelas'] ||
    raw['Nama Kelas'] ||
    raw['Rombel'] ||
    raw['rombel'] ||
    raw['ID Kelas'] ||
    ''
  ).trim();

  let classId = rawClass;
  if (rawClass) {
    const matched = findMatchingClass(rawClass, classes);
    if (matched) {
      classId = matched.id;
    } else {
      // If student has a class name that isn't registered yet in classes, register it dynamically!
      const newClass = normalizeClassItem({ name: rawClass }, classes.length);
      classes.push(newClass);
      setStored(STORAGE_KEYS.CLASSES, classes);
      classId = newClass.id;
    }
  } else {
    classId = classes[0]?.id || 'cls-1';
  }

  const academicYear = String(raw.academicYear || raw['academicYear'] || raw['Tahun Ajaran'] || '2024/2025').trim();
  const isActive = raw.isActive !== undefined ? Boolean(raw.isActive && raw.isActive !== '0' && raw.isActive !== 'false') : true;

  return {
    id: String(id),
    nis: rawNis,
    nisn: rawNisn,
    name: rawName || `Murid ${index + 1}`,
    gender,
    classId,
    academicYear,
    isActive,
  };
}

// -------------------------------------------------------------
// CLASSES
// -------------------------------------------------------------
export function getClasses(): ClassItem[] {
  let rawList = getStored<any[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
  if (!Array.isArray(rawList) || rawList.length === 0) {
    rawList = DEFAULT_CLASSES;
  }

  const oldDemoNames: Record<string, string> = {
    'X-A': 'X-1',
    'X-B': 'X-2',
    'XI-MIPA 1': 'XI-1',
    'XI-MIPA 2': 'XI-2',
    'XII-MIPA 1': 'XII-1',
  };

  const seenIds = new Set<string>();
  const list: ClassItem[] = [];

  rawList.forEach((raw, idx) => {
    const normalized = normalizeClassItem(raw, idx);
    if (oldDemoNames[normalized.name]) {
      normalized.name = oldDemoNames[normalized.name];
    }
    // Prevent duplicate IDs
    if (!seenIds.has(normalized.id)) {
      seenIds.add(normalized.id);
      list.push(normalized);
    }
  });

  return list;
}

export async function saveClass(item: ClassItem): Promise<void> {
  const normalized = normalizeClassItem(item);
  const list = getClasses();
  const idx = list.findIndex((c) => c.id === normalized.id);
  const oldItem = idx > -1 ? list[idx] : null;

  if (idx > -1) {
    list[idx] = normalized;
  } else {
    list.push(normalized);
  }
  setStored(STORAGE_KEYS.CLASSES, list);

  // If class name changed, propagate update to journals className if necessary
  if (oldItem && oldItem.name !== normalized.name) {
    const journals = getJournals();
    let jUpdated = false;
    journals.forEach((j) => {
      if (j.classIds && j.classIds.includes(normalized.id)) {
        j.className = j.classIds.map((cid) => list.find((c) => c.id === cid)?.name || cid).join(', ');
        jUpdated = true;
      }
    });
    if (jUpdated) {
      setStored(STORAGE_KEYS.JOURNALS, journals);
    }
  }

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan kelas ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Kelas', normalized);
    notifySync({
      isSyncing: false,
      statusText: 'Tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteClass(id: string, reassignToClassId?: string): Promise<void> {
  const list = getClasses().filter((c) => c.id !== id);
  setStored(STORAGE_KEYS.CLASSES, list);

  const fallbackClassId = reassignToClassId || list[0]?.id;

  // Reassign any students that were in the deleted class to avoid orphaned students
  if (fallbackClassId) {
    const students = getStudents();
    let updated = false;
    students.forEach((s) => {
      if (s.classId === id) {
        s.classId = fallbackClassId;
        updated = true;
      }
    });
    if (updated) {
      setStored(STORAGE_KEYS.STUDENTS, students);
    }
  }

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Kelas', id);
  }
}

// -------------------------------------------------------------
// STUDENTS (DATA MURID)
// -------------------------------------------------------------
export function getStudents(): Student[] {
  const classes = getClasses();
  let rawList = getStored<any[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  if (!Array.isArray(rawList) || rawList.length === 0) {
    rawList = DEFAULT_STUDENTS;
  }

  const seenIds = new Set<string>();
  const list: Student[] = [];

  rawList.forEach((raw, idx) => {
    const s = normalizeStudentItem(raw, classes, idx);
    let finalId = s.id;
    let counter = 1;
    while (seenIds.has(finalId)) {
      finalId = `${s.id}-${counter++}`;
    }
    s.id = finalId;
    seenIds.add(finalId);
    list.push(s);
  });

  return list;
}

/**
 * Reassigns all students from one class to another
 */
export async function reassignStudentsClass(fromClassId: string, toClassId: string): Promise<number> {
  const students = getStudents();
  let count = 0;
  students.forEach((s) => {
    if (s.classId === fromClassId) {
      s.classId = toClassId;
      count++;
    }
  });
  if (count > 0) {
    setStored(STORAGE_KEYS.STUDENTS, students);
  }
  return count;
}

/**
 * Universally syncs all classes with students, schedules, journals, and attendance
 * Ensures no orphan class IDs exist in any feature.
 */
export async function syncAllClassesWithData(): Promise<{ studentsSynced: number; journalsSynced: number }> {
  let classes = getClasses();
  if (classes.length === 0) return { studentsSynced: 0, journalsSynced: 0 };
  const validClassIds = new Set(classes.map((c) => c.id));
  const fallbackClassId = classes[0].id;

  // 1. Sync Students
  const students = getStudents();
  let studentsSynced = 0;
  students.forEach((s) => {
    if (!validClassIds.has(s.classId)) {
      const matched = findMatchingClass(s.classId, classes);
      if (matched) {
        s.classId = matched.id;
        studentsSynced++;
      } else if (s.classId && s.classId.trim()) {
        const newClass = normalizeClassItem({ name: s.classId }, classes.length);
        classes.push(newClass);
        validClassIds.add(newClass.id);
        s.classId = newClass.id;
        studentsSynced++;
      } else {
        s.classId = fallbackClassId;
        studentsSynced++;
      }
    }
  });

  if (studentsSynced > 0) {
    setStored(STORAGE_KEYS.CLASSES, classes);
    setStored(STORAGE_KEYS.STUDENTS, students);
  }

  // 2. Sync Journals
  const journals = getJournals();
  let journalsSynced = 0;
  journals.forEach((j) => {
    if (j.classIds && j.classIds.length > 0) {
      const filtered = j.classIds.filter((cid) => validClassIds.has(cid));
      if (filtered.length === 0) {
        j.classIds = [fallbackClassId];
        j.classId = fallbackClassId;
        j.className = classes.find((c) => c.id === fallbackClassId)?.name || fallbackClassId;
        journalsSynced++;
      } else if (filtered.length !== j.classIds.length) {
        j.classIds = filtered;
        j.classId = filtered.join(', ');
        j.className = filtered.map((cid) => classes.find((c) => c.id === cid)?.name || cid).join(', ');
        journalsSynced++;
      }
    }
  });
  if (journalsSynced > 0) {
    setStored(STORAGE_KEYS.JOURNALS, journals);
  }

  return { studentsSynced, journalsSynced };
}

/**
 * Resets all classes and demo items to standard PJOK classes
 */
export async function resetClassesToPJOKDefaults(): Promise<void> {
  setStored(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
  setStored(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  setStored(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULE);
  setStored(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
  setStored(STORAGE_KEYS.JOURNALS, DEFAULT_JOURNALS);
  setStored(STORAGE_KEYS.KNOWLEDGE, DEFAULT_KNOWLEDGE_ASSESSMENTS);
  setStored(STORAGE_KEYS.SKILLS, DEFAULT_SKILL_ASSESSMENTS);
  setStored(STORAGE_KEYS.ATTITUDES, DEFAULT_ATTITUDE_ASSESSMENTS);
  const settings = getSettings();
  settings.subject = 'PJOK';
  setStored(STORAGE_KEYS.SETTINGS, settings);
}

// -------------------------------------------------------------
// PERIODS (JAM PELAJARAN 0 - 10)
// -------------------------------------------------------------
export function getPeriods(): PeriodTime[] {
  return getStored<PeriodTime[]>(STORAGE_KEYS.PERIODS, DEFAULT_PERIODS);
}

export async function savePeriods(periods: PeriodTime[]): Promise<void> {
  setStored(STORAGE_KEYS.PERIODS, periods);
  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan jam pelajaran ke Spreadsheet...', isError: false });
    await batchSaveRowsRemote(settings.appsScriptUrl, 'Jam_Pelajaran', periods);
    notifySync({
      isSyncing: false,
      statusText: 'Jam pelajaran tersimpan di Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}


export async function saveStudent(student: Student): Promise<void> {
  const list = getStudents();
  const idx = list.findIndex((s) => s.id === student.id);
  if (idx > -1) {
    list[idx] = student;
  } else {
    list.push(student);
  }
  setStored(STORAGE_KEYS.STUDENTS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan data murid ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Data_Murid', student);
    notifySync({
      isSyncing: false,
      statusText: 'Data murid tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function batchSaveStudents(students: Student[]): Promise<void> {
  const existing = getStudents();
  const map = new Map<string, Student>();
  existing.forEach((s) => map.set(s.id, s));
  students.forEach((s) => map.set(s.id, s));
  const merged = Array.from(map.values());
  setStored(STORAGE_KEYS.STUDENTS, merged);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan import murid ke Spreadsheet...', isError: false });
    await batchSaveRowsRemote(settings.appsScriptUrl, 'Data_Murid', students);
    notifySync({
      isSyncing: false,
      statusText: `${students.length} murid tersimpan di Spreadsheet`,
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteStudent(id: string): Promise<void> {
  const list = getStudents().filter((s) => s.id !== id);
  setStored(STORAGE_KEYS.STUDENTS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Data_Murid', id);
  }
}

export async function deleteStudentsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getStudents().filter((s) => !idSet.has(s.id));
  setStored(STORAGE_KEYS.STUDENTS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Data_Murid', id);
    }
  }
}

// -------------------------------------------------------------
// SCHEDULE (JADWAL MENGAJAR)
// -------------------------------------------------------------
export function getSchedules(): ScheduleItem[] {
  return getStored<ScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULE);
}

export async function saveSchedule(item: ScheduleItem): Promise<void> {
  const list = getSchedules();
  const idx = list.findIndex((s) => s.id === item.id);
  if (idx > -1) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  setStored(STORAGE_KEYS.SCHEDULES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan jadwal ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Jadwal_Mengajar', item);
    notifySync({
      isSyncing: false,
      statusText: 'Jadwal tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  const list = getSchedules().filter((s) => s.id !== id);
  setStored(STORAGE_KEYS.SCHEDULES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Jadwal_Mengajar', id);
  }
}

export async function deleteSchedulesBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getSchedules().filter((s) => !idSet.has(s.id));
  setStored(STORAGE_KEYS.SCHEDULES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Jadwal_Mengajar', id);
    }
  }
}

// -------------------------------------------------------------
// ATTENDANCE (ABSENSI MURID)
// -------------------------------------------------------------
export function getAttendance(): AttendanceRecord[] {
  return getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
}

/**
 * Menyimpan absensi satu sesi (daftar murid) dengan mencegah duplikasi baris
 */
export async function saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
  const list = getAttendance();
  const existingMap = new Map<string, number>();
  list.forEach((rec, idx) => {
    // Unique key: date + classId + subject + period + studentId
    const key = `${rec.date}_${rec.classId}_${rec.period}_${rec.studentId}`;
    existingMap.set(key, idx);
  });

  const updatedList = [...list];
  records.forEach((newRec) => {
    const key = `${newRec.date}_${newRec.classId}_${newRec.period}_${newRec.studentId}`;
    if (existingMap.has(key)) {
      const idx = existingMap.get(key)!;
      updatedList[idx] = newRec;
    } else {
      updatedList.push(newRec);
      existingMap.set(key, updatedList.length - 1);
    }
  });

  setStored(STORAGE_KEYS.ATTENDANCE, updatedList);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan absensi ke Google Spreadsheet...', isError: false });
    await batchSaveRowsRemote(settings.appsScriptUrl, 'Absensi', records);
    notifySync({
      isSyncing: false,
      statusText: 'Absensi berhasil disimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteAttendance(id: string): Promise<void> {
  const list = getAttendance().filter((a) => a.id !== id);
  setStored(STORAGE_KEYS.ATTENDANCE, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Absensi', id);
  }
}

export async function deleteAttendanceBatch(ids: string[]): Promise<void> {
  const set = new Set(ids);
  const list = getAttendance().filter((a) => !set.has(a.id));
  setStored(STORAGE_KEYS.ATTENDANCE, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Absensi', id);
    }
  }
}

// -------------------------------------------------------------
// TEACHING JOURNAL (JURNAL MENGAJAR)
// -------------------------------------------------------------
export function getJournals(): TeachingJournal[] {
  return getStored<TeachingJournal[]>(STORAGE_KEYS.JOURNALS, DEFAULT_JOURNALS);
}

export async function saveJournal(journal: TeachingJournal): Promise<void> {
  const list = getJournals();
  const idx = list.findIndex((j) => j.id === journal.id);
  if (idx > -1) {
    list[idx] = journal;
  } else {
    list.unshift(journal);
  }
  setStored(STORAGE_KEYS.JOURNALS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan jurnal ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Jurnal_Mengajar', journal);
    notifySync({
      isSyncing: false,
      statusText: 'Jurnal tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteJournal(id: string): Promise<void> {
  const list = getJournals().filter((j) => j.id !== id);
  setStored(STORAGE_KEYS.JOURNALS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Jurnal_Mengajar', id);
  }
}

export async function deleteJournalsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getJournals().filter((j) => !idSet.has(j.id));
  setStored(STORAGE_KEYS.JOURNALS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Jurnal_Mengajar', id);
    }
  }
}

// -------------------------------------------------------------
// KNOWLEDGE ASSESSMENT (PENILAIAN PENGETAHUAN)
// -------------------------------------------------------------
export function getKnowledgeAssessments(): KnowledgeAssessment[] {
  return getStored<KnowledgeAssessment[]>(STORAGE_KEYS.KNOWLEDGE, DEFAULT_KNOWLEDGE_ASSESSMENTS);
}

export async function saveKnowledgeAssessmentBatch(records: KnowledgeAssessment[]): Promise<void> {
  const list = getKnowledgeAssessments();
  const map = new Map<string, KnowledgeAssessment>();
  list.forEach((item) => map.set(item.id, item));
  records.forEach((item) => map.set(item.id, item));
  const merged = Array.from(map.values());
  setStored(STORAGE_KEYS.KNOWLEDGE, merged);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan nilai pengetahuan ke Spreadsheet...', isError: false });
    await batchSaveRowsRemote(settings.appsScriptUrl, 'Nilai_Pengetahuan', records);
    notifySync({
      isSyncing: false,
      statusText: 'Nilai pengetahuan tersimpan di Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteKnowledgeAssessment(id: string): Promise<void> {
  const list = getKnowledgeAssessments().filter((k) => k.id !== id);
  setStored(STORAGE_KEYS.KNOWLEDGE, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Nilai_Pengetahuan', id);
  }
}

export async function deleteKnowledgeAssessmentsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getKnowledgeAssessments().filter((k) => !idSet.has(k.id));
  setStored(STORAGE_KEYS.KNOWLEDGE, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Nilai_Pengetahuan', id);
    }
  }
}

// -------------------------------------------------------------
// SKILL ASSESSMENT (PENILAIAN KETERAMPILAN)
// -------------------------------------------------------------
export function getSkillAssessments(): SkillAssessment[] {
  return getStored<SkillAssessment[]>(STORAGE_KEYS.SKILLS, DEFAULT_SKILL_ASSESSMENTS);
}

export async function saveSkillAssessment(record: SkillAssessment): Promise<void> {
  const list = getSkillAssessments();
  const idx = list.findIndex((s) => s.id === record.id);
  if (idx > -1) {
    list[idx] = record;
  } else {
    list.push(record);
  }
  setStored(STORAGE_KEYS.SKILLS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan penilaian keterampilan...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Nilai_Keterampilan', record);
    notifySync({
      isSyncing: false,
      statusText: 'Penilaian keterampilan tersimpan di Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function saveSkillAssessmentBatch(records: SkillAssessment[]): Promise<void> {
  const list = getSkillAssessments();
  const map = new Map<string, SkillAssessment>();
  list.forEach((item) => map.set(item.id, item));
  records.forEach((item) => map.set(item.id, item));
  setStored(STORAGE_KEYS.SKILLS, Array.from(map.values()));

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan nilai keterampilan ke Spreadsheet...', isError: false });
    await batchSaveRowsRemote(settings.appsScriptUrl, 'Nilai_Keterampilan', records);
    notifySync({
      isSyncing: false,
      statusText: 'Nilai keterampilan tersimpan di Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteSkillAssessment(id: string): Promise<void> {
  const list = getSkillAssessments().filter((s) => s.id !== id);
  setStored(STORAGE_KEYS.SKILLS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Nilai_Keterampilan', id);
  }
}

export async function deleteSkillAssessmentsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getSkillAssessments().filter((s) => !idSet.has(s.id));
  setStored(STORAGE_KEYS.SKILLS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Nilai_Keterampilan', id);
    }
  }
}

// -------------------------------------------------------------
// ATTITUDE ASSESSMENT (PENILAIAN SIKAP)
// -------------------------------------------------------------
export function getAttitudeAssessments(): AttitudeAssessment[] {
  return getStored<AttitudeAssessment[]>(STORAGE_KEYS.ATTITUDES, DEFAULT_ATTITUDE_ASSESSMENTS);
}

export async function saveAttitudeAssessmentBatch(records: AttitudeAssessment[]): Promise<void> {
  const list = getAttitudeAssessments();
  const map = new Map<string, AttitudeAssessment>();
  list.forEach((item) => map.set(item.id, item));
  records.forEach((item) => map.set(item.id, item));
  setStored(STORAGE_KEYS.ATTITUDES, Array.from(map.values()));

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan penilaian sikap ke Spreadsheet...', isError: false });
    await batchSaveRowsRemote(settings.appsScriptUrl, 'Nilai_Sikap', records);
    notifySync({
      isSyncing: false,
      statusText: 'Penilaian sikap tersimpan di Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteAttitudeAssessment(id: string): Promise<void> {
  const list = getAttitudeAssessments().filter((a) => a.id !== id);
  setStored(STORAGE_KEYS.ATTITUDES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Nilai_Sikap', id);
  }
}

export async function deleteAttitudeBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getAttitudeAssessments().filter((a) => !idSet.has(a.id));
  setStored(STORAGE_KEYS.ATTITUDES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Nilai_Sikap', id);
    }
  }
}
export const deleteAttitudeAssessmentsBatch = deleteAttitudeBatch;

// -------------------------------------------------------------
// MENTORING JOURNAL (JURNAL PENDAMPINGAN)
export function getMentoringJournals(): MentoringJournal[] {
  const data = getStored<MentoringJournal[]>(STORAGE_KEYS.MENTORING, DEFAULT_MENTORING_JOURNALS);
  if (!data || !Array.isArray(data) || data.length === 0) {
    setStored(STORAGE_KEYS.MENTORING, DEFAULT_MENTORING_JOURNALS);
    return DEFAULT_MENTORING_JOURNALS;
  }
  return data;
}

export function resetMentoringJournals(): MentoringJournal[] {
  setStored(STORAGE_KEYS.MENTORING, DEFAULT_MENTORING_JOURNALS);
  return DEFAULT_MENTORING_JOURNALS;
}

export async function saveMentoringJournal(journal: MentoringJournal): Promise<void> {
  const list = getMentoringJournals();
  const idx = list.findIndex((m) => m.id === journal.id);
  if (idx > -1) {
    list[idx] = journal;
  } else {
    list.unshift(journal);
  }
  setStored(STORAGE_KEYS.MENTORING, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan jurnal pendampingan ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Jurnal_Pendampingan', journal);
    notifySync({
      isSyncing: false,
      statusText: 'Jurnal pendampingan tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteMentoringJournal(id: string): Promise<void> {
  const list = getMentoringJournals().filter((m) => m.id !== id);
  setStored(STORAGE_KEYS.MENTORING, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Jurnal_Pendampingan', id);
  }
}

export async function deleteMentoringJournalsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getMentoringJournals().filter((m) => !idSet.has(m.id));
  setStored(STORAGE_KEYS.MENTORING, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Jurnal_Pendampingan', id);
    }
  }
}

// -------------------------------------------------------------
// REFLECTION CARD (KARTU REFLEKSI)
// -------------------------------------------------------------
export function getReflections(): ReflectionCard[] {
  return getStored<ReflectionCard[]>(STORAGE_KEYS.REFLECTIONS, DEFAULT_REFLECTIONS);
}

export async function saveReflection(card: ReflectionCard): Promise<void> {
  const list = getReflections();
  const idx = list.findIndex((r) => r.id === card.id);
  if (idx > -1) {
    list[idx] = card;
  } else {
    list.unshift(card);
  }
  setStored(STORAGE_KEYS.REFLECTIONS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan kartu refleksi ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Kartu_Refleksi', card);
    notifySync({
      isSyncing: false,
      statusText: 'Kartu refleksi tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteReflection(id: string): Promise<void> {
  const list = getReflections().filter((r) => r.id !== id);
  setStored(STORAGE_KEYS.REFLECTIONS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Kartu_Refleksi', id);
  }
}

export async function deleteReflectionsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getReflections().filter((r) => !idSet.has(r.id));
  setStored(STORAGE_KEYS.REFLECTIONS, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    for (const id of ids) {
      await deleteRowRemote(settings.appsScriptUrl, 'Kartu_Refleksi', id);
    }
  }
}

// -------------------------------------------------------------
// FULL SYNC WITH GOOGLE SPREADSHEET
// -------------------------------------------------------------
export async function syncAllFromRemote(): Promise<{ success: boolean; message: string }> {
  const settings = getSettings();
  if (!settings.appsScriptUrl) {
    return { success: false, message: 'URL Apps Script belum diisi di Pengaturan.' };
  }

  notifySync({ isSyncing: true, statusText: 'Mengambil seluruh data dari Google Spreadsheet...', isError: false });
  try {
    const res = await fetchAllRemoteData(settings.appsScriptUrl);
    if (res.status === 'success' && res.data) {
      const data = res.data;

      // Helper to find sheet by multiple alternative names (case-insensitive / spacing)
      const findSheet = (names: string[]): any[] | null => {
        for (const key of Object.keys(data)) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const n of names) {
            const cleanTarget = n.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanKey === cleanTarget && Array.isArray(data[key]) && data[key].length > 0) {
              return data[key];
            }
          }
        }
        return null;
      };

      // 1. Classes: normalize immediately
      const classesRaw = findSheet(['Kelas', 'Data_Kelas', 'Data Kelas', 'Daftar_Kelas', 'Daftar Kelas', 'Rombel']);
      if (classesRaw) {
        const normalizedClasses = classesRaw.map((c, i) => normalizeClassItem(c, i));
        setStored(STORAGE_KEYS.CLASSES, normalizedClasses);
      }

      // 2. Students: normalize immediately with valid classes
      const studentsRaw = findSheet(['Data_Murid', 'Data Murid', 'Murid', 'Siswa', 'Data_Siswa', 'Data Siswa', 'Daftar_Siswa']);
      if (studentsRaw) {
        const curClasses = getClasses();
        const normalizedStudents = studentsRaw.map((s, i) => normalizeStudentItem(s, curClasses, i));
        setStored(STORAGE_KEYS.STUDENTS, normalizedStudents);
      }

      // 3. Other sheets
      const jamRaw = findSheet(['Jam_Pelajaran', 'Jam Pelajaran', 'Jam']);
      if (jamRaw) setStored(STORAGE_KEYS.PERIODS, jamRaw);

      const jadwalRaw = findSheet(['Jadwal_Mengajar', 'Jadwal Mengajar', 'Jadwal']);
      if (jadwalRaw) setStored(STORAGE_KEYS.SCHEDULES, jadwalRaw);

      const absensiRaw = findSheet(['Absensi', 'Presensi', 'Data_Absensi']);
      if (absensiRaw) setStored(STORAGE_KEYS.ATTENDANCE, absensiRaw);

      const jurnalRaw = findSheet(['Jurnal_Mengajar', 'Jurnal Mengajar', 'Jurnal']);
      if (jurnalRaw) setStored(STORAGE_KEYS.JOURNALS, jurnalRaw);

      const knowRaw = findSheet(['Nilai_Pengetahuan', 'Nilai Pengetahuan', 'Pengetahuan']);
      if (knowRaw) setStored(STORAGE_KEYS.KNOWLEDGE, knowRaw);

      const skillRaw = findSheet(['Nilai_Keterampilan', 'Nilai Keterampilan', 'Keterampilan']);
      if (skillRaw) setStored(STORAGE_KEYS.SKILLS, skillRaw);

      const attRaw = findSheet(['Nilai_Sikap', 'Nilai Sikap', 'Sikap']);
      if (attRaw) setStored(STORAGE_KEYS.ATTITUDES, attRaw);

      const mentRaw = findSheet(['Jurnal_Pendampingan', 'Jurnal Pendampingan', 'Pendampingan']);
      if (mentRaw) setStored(STORAGE_KEYS.MENTORING, mentRaw);

      const refRaw = findSheet(['Kartu_Refleksi', 'Kartu Refleksi', 'Refleksi']);
      if (refRaw) setStored(STORAGE_KEYS.REFLECTIONS, refRaw);

      notifySync({
        isSyncing: false,
        statusText: 'Data sinkron dengan Google Spreadsheet',
        isError: false,
        lastSyncTime: new Date().toLocaleTimeString('id-ID'),
      });
      return { success: true, message: 'Seluruh data berhasil disinkronkan dari Spreadsheet!' };
    } else {
      notifySync({
        isSyncing: false,
        statusText: res.message || 'Gagal sinkron data',
        isError: true,
      });
      return { success: false, message: res.message || 'Gagal sinkron' };
    }
  } catch (err: any) {
    notifySync({
      isSyncing: false,
      statusText: 'Kesalahan saat menghubungi Spreadsheet',
      isError: true,
    });
    return { success: false, message: err.message };
  }
}
