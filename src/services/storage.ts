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
  return getStored<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
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
// CLASSES
// -------------------------------------------------------------
export function getClasses(): ClassItem[] {
  return getStored<ClassItem[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
}

export async function saveClass(item: ClassItem): Promise<void> {
  const list = getClasses();
  const idx = list.findIndex((c) => c.id === item.id);
  if (idx > -1) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  setStored(STORAGE_KEYS.CLASSES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    notifySync({ isSyncing: true, statusText: 'Menyimpan kelas ke Spreadsheet...', isError: false });
    await saveRowRemote(settings.appsScriptUrl, 'Kelas', item);
    notifySync({
      isSyncing: false,
      statusText: 'Tersimpan di Google Spreadsheet',
      isError: false,
      lastSyncTime: new Date().toLocaleTimeString('id-ID'),
    });
  }
}

export async function deleteClass(id: string): Promise<void> {
  const list = getClasses().filter((c) => c.id !== id);
  setStored(STORAGE_KEYS.CLASSES, list);

  const settings = getSettings();
  if (settings.appsScriptUrl) {
    await deleteRowRemote(settings.appsScriptUrl, 'Kelas', id);
  }
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

// -------------------------------------------------------------
// STUDENTS (DATA MURID)
// -------------------------------------------------------------
export function getStudents(): Student[] {
  return getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
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
      if (Array.isArray(data['Kelas']) && data['Kelas'].length > 0) setStored(STORAGE_KEYS.CLASSES, data['Kelas']);
      if (Array.isArray(data['Jam_Pelajaran']) && data['Jam_Pelajaran'].length > 0) setStored(STORAGE_KEYS.PERIODS, data['Jam_Pelajaran']);
      if (Array.isArray(data['Data_Murid']) && data['Data_Murid'].length > 0) setStored(STORAGE_KEYS.STUDENTS, data['Data_Murid']);
      if (Array.isArray(data['Jadwal_Mengajar']) && data['Jadwal_Mengajar'].length > 0) setStored(STORAGE_KEYS.SCHEDULES, data['Jadwal_Mengajar']);
      if (Array.isArray(data['Absensi']) && data['Absensi'].length > 0) setStored(STORAGE_KEYS.ATTENDANCE, data['Absensi']);
      if (Array.isArray(data['Jurnal_Mengajar']) && data['Jurnal_Mengajar'].length > 0) setStored(STORAGE_KEYS.JOURNALS, data['Jurnal_Mengajar']);
      if (Array.isArray(data['Nilai_Pengetahuan']) && data['Nilai_Pengetahuan'].length > 0) setStored(STORAGE_KEYS.KNOWLEDGE, data['Nilai_Pengetahuan']);
      if (Array.isArray(data['Nilai_Keterampilan']) && data['Nilai_Keterampilan'].length > 0) setStored(STORAGE_KEYS.SKILLS, data['Nilai_Keterampilan']);
      if (Array.isArray(data['Nilai_Sikap']) && data['Nilai_Sikap'].length > 0) setStored(STORAGE_KEYS.ATTITUDES, data['Nilai_Sikap']);
      if (Array.isArray(data['Jurnal_Pendampingan']) && data['Jurnal_Pendampingan'].length > 0) setStored(STORAGE_KEYS.MENTORING, data['Jurnal_Pendampingan']);
      if (Array.isArray(data['Kartu_Refleksi']) && data['Kartu_Refleksi'].length > 0) setStored(STORAGE_KEYS.REFLECTIONS, data['Kartu_Refleksi']);

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
