import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Users,
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  PeriodTime,
  AttendanceRecord,
  AttendanceStatus,
  AppSettings,
} from '../../types';

interface AttendanceViewProps {
  students: Student[];
  classes: ClassItem[];
  periods: PeriodTime[];
  settings: AppSettings;
  existingAttendance: AttendanceRecord[];
  onSaveAttendanceBatch: (records: AttendanceRecord[]) => Promise<void>;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  periods,
  settings,
  existingAttendance,
  onSaveAttendanceBatch,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(settings.subject || 'Matematika');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // Active attendance state for students in selected class
  const [studentStatuses, setStudentStatuses] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter students by active & class
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // When date, class, or period changes, load existing records if already saved!
  useEffect(() => {
    const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    classStudents.forEach((student) => {
      // Find if record exists for this date, class, period, and student
      const existing = existingAttendance.find(
        (a) =>
          a.date === selectedDate &&
          a.classId === selectedClassId &&
          a.period === selectedPeriod &&
          a.studentId === student.id
      );

      if (existing) {
        initialMap[student.id] = {
          status: existing.status,
          notes: existing.notes || '',
        };
      } else {
        // Default to 'H' (Hadir)
        initialMap[student.id] = {
          status: 'H',
          notes: '',
        };
      }
    });

    setStudentStatuses(initialMap);
    setSaveSuccessMessage(null);
  }, [selectedDate, selectedClassId, selectedPeriod, classStudents, existingAttendance]);

  // Mark All Present (Hadir Semua)
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status: 'H',
        notes: studentStatuses[s.id]?.notes || '',
      };
    });
    setStudentStatuses(updated);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  // Compute live statistics
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    classStudents.forEach((s) => {
      const st = studentStatuses[s.id]?.status || 'H';
      if (st === 'H') hadir++;
      else if (st === 'S') sakit++;
      else if (st === 'I') izin++;
      else if (st === 'A') alpa++;
    });

    const total = classStudents.length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, sakit, izin, alpa, persentase };
  }, [classStudents, studentStatuses]);

  // Save Attendance Handler
  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) {
      alert('Tidak ada murid dalam kelas yang dipilih.');
      return;
    }

    setIsSubmitting(true);
    setSaveSuccessMessage(null);

    try {
      const recordsToSave: AttendanceRecord[] = classStudents.map((student) => {
        const item = studentStatuses[student.id] || { status: 'H', notes: '' };
        // Check if existing ID is already present to prevent duplicate row IDs
        const existing = existingAttendance.find(
          (a) =>
            a.date === selectedDate &&
            a.classId === selectedClassId &&
            a.period === selectedPeriod &&
            a.studentId === student.id
        );

        return {
          id: existing ? existing.id : `att-${selectedDate}-${selectedClassId}-${selectedPeriod}-${student.id}`,
          date: selectedDate,
          classId: selectedClassId,
          subject,
          period: selectedPeriod,
          studentId: student.id,
          studentName: student.name,
          status: item.status,
          notes: item.notes,
          academicYear: settings.academicYear,
          semester: settings.semester,
        };
      });

      await onSaveAttendanceBatch(recordsToSave);
      setSaveSuccessMessage(
        `Absensi tanggal ${selectedDate} kelas ${
          classes.find((c) => c.id === selectedClassId)?.name
        } berhasil disimpan!`
      );
    } catch (err: any) {
      alert('Gagal menyimpan absensi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Absensi Murid
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catat kehadiran murid secara terpadu. Sistem otomatis mencegah data ganda pada sesi yang sama.
          </p>
        </div>

        <button
          type="button"
          disabled={isSubmitting || classStudents.length === 0}
          onClick={handleSaveAttendance}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}
        </button>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Session Filter Form */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Pilih Parameter Pembelajaran
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tanggal Pembelajaran
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Matematika"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Attendance Form & Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              Daftar Murid Kelas {classes.find((c) => c.id === selectedClassId)?.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">({classStudents.length} murid terdaftar)</span>
          </div>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hadir Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Nama Murid</th>
                <th className="py-2.5 px-1 w-12 text-center text-emerald-700 dark:text-emerald-400 font-bold" title="Hadir (H)">
                  H
                </th>
                <th className="py-2.5 px-1 w-12 text-center text-blue-700 dark:text-blue-400 font-bold" title="Sakit (S)">
                  S
                </th>
                <th className="py-2.5 px-1 w-12 text-center text-amber-700 dark:text-amber-400 font-bold" title="Izin (I)">
                  I
                </th>
                <th className="py-2.5 px-1 w-12 text-center text-rose-700 dark:text-rose-400 font-bold" title="Alpa (A)">
                  A
                </th>
                <th className="py-2.5 px-4 min-w-[160px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.length > 0 ? (
                classStudents.map((student, idx) => {
                  const current = studentStatuses[student.id] || { status: 'H', notes: '' };
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </td>

                      {/* Kolom Terpisah: H (Hadir) */}
                      <td className="py-2.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'H')}
                          title={`${student.name}: Hadir (H)`}
                          className={`w-7 h-7 rounded-md font-bold text-xs inline-flex items-center justify-center transition-all ${
                            current.status === 'H'
                              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-700 font-extrabold'
                              : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          H
                        </button>
                      </td>

                      {/* Kolom Terpisah: S (Sakit) */}
                      <td className="py-2.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'S')}
                          title={`${student.name}: Sakit (S)`}
                          className={`w-7 h-7 rounded-md font-bold text-xs inline-flex items-center justify-center transition-all ${
                            current.status === 'S'
                              ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300 dark:ring-blue-700 font-extrabold'
                              : 'text-slate-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          S
                        </button>
                      </td>

                      {/* Kolom Terpisah: I (Izin) */}
                      <td className="py-2.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'I')}
                          title={`${student.name}: Izin (I)`}
                          className={`w-7 h-7 rounded-md font-bold text-xs inline-flex items-center justify-center transition-all ${
                            current.status === 'I'
                              ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-700 font-extrabold'
                              : 'text-slate-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          I
                        </button>
                      </td>

                      {/* Kolom Terpisah: A (Alpa) */}
                      <td className="py-2.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'A')}
                          title={`${student.name}: Alpa (A)`}
                          className={`w-7 h-7 rounded-md font-bold text-xs inline-flex items-center justify-center transition-all ${
                            current.status === 'A'
                              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-700 font-extrabold'
                              : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          A
                        </button>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={current.notes}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="Catatan..."
                          className="w-full text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    Belum ada murid aktif yang terdaftar di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Rekap jumlah hadir, sakit, ijin, alpa dalam 1 baris ke samping */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300 mr-0.5">Jumlah:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs">
                <span>Hadir:</span>
                <strong className="font-bold tabular-nums">{stats.hadir}</strong>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 text-blue-800 dark:text-blue-300 text-xs">
                <span>Sakit:</span>
                <strong className="font-bold tabular-nums">{stats.sakit}</strong>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs">
                <span>Izin:</span>
                <strong className="font-bold tabular-nums">{stats.izin}</strong>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs">
                <span>Alpa:</span>
                <strong className="font-bold tabular-nums">{stats.alpa}</strong>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors justify-center self-end sm:self-auto"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
