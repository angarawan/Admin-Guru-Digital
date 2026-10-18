export interface AppSettings {
  teacherName: string;
  teacherNip: string;
  schoolName: string;
  subject: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  appsScriptUrl: string;
  spreadsheetId: string;
  driveFolderId: string;
  schoolLogo: string;
  darkMode: boolean;
  skillIndicators: string[];
  attitudeIndicators: string[];
}

export interface ClassItem {
  id: string;
  name: string;
  level: string;
  homeroomTeacher?: string;
}

export interface PeriodTime {
  period: number; // 0 to 10
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  academicYear: string;
  isActive: boolean;
}

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  classId: string;
  subject: string;
  periodStart: number;
  periodEnd: number;
  startTime: string;
  endTime: string;
  room: string;
  notes: string;
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  subject: string;
  period: number;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  notes: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface TeachingJournal {
  id: string;
  date: string;
  day: string;
  classId: string;
  subject: string;
  periodStart: number;
  periodEnd: number;
  topic: string;
  learningObjective: string;
  activities: string;
  method: string;
  results: string;
  obstacles: string;
  reflection: string;
  followUp: string;
  driveLink: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface KnowledgeAssessment {
  id: string;
  date: string;
  classId: string;
  subject: string;
  topic: string;
  assessmentType: 'Formatif' | 'Sumatif' | 'Tugas' | 'Ulangan Harian' | 'PTS' | 'PAS' | 'Lainnya';
  studentId: string;
  studentName: string;
  score: number;
  notes: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface SkillAssessmentIndicator {
  name: string;
  score: number; // 1 to 4
  weight: number; // e.g. 1
}

export interface SkillAssessment {
  id: string;
  date: string;
  classId: string;
  subject: string;
  topic: string;
  practiceType: string;
  studentId: string;
  studentName: string;
  indicators: SkillAssessmentIndicator[];
  finalScore: number; // 0 - 100
  notes: string;
  feedback: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface AttitudeAssessment {
  id: string;
  date: string;
  classId: string;
  subject: string;
  studentId: string;
  studentName: string;
  scores: {
    discipline: number; // 1-4
    responsibility: number; // 1-4
    cooperation: number; // 1-4
    sportsmanship: number; // 1-4
    confidence: number; // 1-4
    [key: string]: number;
  };
  behaviorNotes: string;
  observationDate: string;
  resultSummary: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export type MentoringStatus = 'Dalam Pendampingan' | 'Perlu Tindak Lanjut' | 'Selesai';

export interface MentoringJournal {
  id: string;
  journalNumber: string;
  date: string;
  studentId: string;
  studentName: string;
  classId: string;
  problemType: string;
  problemDescription: string;
  identificationResult: string;
  mentoringSteps: string;
  mutualAgreement: string;
  followUp: string;
  status: MentoringStatus;
  nextEvaluationDate: string;
  mentorTeacher: string;
  teacherSignature: string; // Base64 data or Google Drive link
  studentSignature: string; // Base64 data or Google Drive link
}

export type ReflectionEmotion = 'Senang' | 'Biasa saja' | 'Kesulitan';

export interface ReflectionCard {
  id: string;
  date: string;
  classId: string;
  studentId: string;
  studentName: string;
  topic: string;
  understood: string;
  difficulties: string;
  interestingParts: string;
  improvements: string;
  emotion: ReflectionEmotion;
  teacherNotes: string;
  followUp: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export type NavigationMenu =
  | 'dashboard'
  | 'murid'
  | 'jadwal'
  | 'absensi'
  | 'jurnal'
  | 'nilai_pengetahuan'
  | 'nilai_keterampilan'
  | 'nilai_sikap'
  | 'pendampingan'
  | 'refleksi'
  | 'rekap_absensi'
  | 'rekap_jurnal'
  | 'rekap_nilai'
  | 'pengaturan';
