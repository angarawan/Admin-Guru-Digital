import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Users,
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Trash2,
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
  onBatchDeleteAttendance?: (ids: string[]) => Promise<void>;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  periods,
  settings,
  existingAttendance,
  onSaveAttendanceBatch,
  onBatchDeleteAttendance,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Selection states
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(settings.subject || 'Matematika');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

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

  const isAllSelected = classStudents.length > 0 && classStudents.every((s) => selectedStudentIds.includes(s.id));
  const isSomeSelected = selectedStudentIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkSetStatus = (status: AttendanceStatus) => {
    if (selectedStudentIds.length === 0) return;
    setStudentStatuses((prev) => {
      const next = { ...prev };
      selectedStudentIds.forEach((sid) => {
        next[sid] = {
          ...next[sid],
          status,
        };
      });
      return next;
    });
  };

  const handleDeleteSelectedAttendance = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    if (confirm(`Apakah Anda yakin ingin menghapus / mengosongkan data absensi untuk ${count} murid yang dicentang pada tanggal ${selectedDate}?`)) {
      // Find existing record IDs for selected students
      const recordIdsToDelete = existingAttendance
        .filter(
          (a) =>
            a.date === selectedDate &&
            a.classId === selectedClassId &&
            a.period === selectedPeriod &&
            selectedStudentIds.includes(a.studentId)
        )
        .map((a) => a.id);

      if (recordIdsToDelete.length > 0 && onBatchDeleteAttendance) {
        await onBatchDeleteAttendance(recordIdsToDelete);
      }

      // Reset in local state
      setStudentStatuses((prev) => {
        const next = { ...prev };
        selectedStudentIds.forEach((sid) => {
          next[sid] = {
            status: 'H',
            notes: '',
          };
        });
        return next;
      });

      setSelectedStudentIds([]);
      setSaveSuccessMessage(`${count} data absensi murid berhasil dihapus/dikosongkan.`);
    }
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
            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Jam Pelajaran Ke-
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            >
              {periods.map((p) => (
                <option key={p.period} value={p.period}>
                  Jam {p.period} ({p.startTime} - {p.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Realtime Attendance Statistics Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Murid</span>
          <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">{stats.total}</span>
        </div>
        <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">Hadir (H)</span>
          <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">{stats.hadir}</span>
        </div>
        <div className="bg-blue-50/60 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">Sakit (S)</span>
          <span className="text-xl font-bold text-blue-800 dark:text-blue-200 tabular-nums">{stats.sakit}</span>
        </div>
        <div className="bg-amber-50/60 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">Izin (I)</span>
          <span className="text-xl font-bold text-amber-800 dark:text-amber-200 tabular-nums">{stats.izin}</span>
        </div>
        <div className="bg-rose-50/60 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">Alpa (A)</span>
          <span className="text-xl font-bold text-rose-800 dark:text-rose-200 tabular-nums">{stats.alpa}</span>
        </div>
        <div className="bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white p-3 rounded-xl text-center shadow-2xs">
          <span className="text-[11px] font-medium text-slate-300 dark:text-slate-400 block">Kehadiran</span>
          <span className="text-xl font-bold text-white tabular-nums">{stats.persentase}%</span>
        </div>
      </div>

      {/* Bulk Delete & Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {selectedStudentIds.length} murid dicentang
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              dari total {classStudents.length} murid
            </span>
            <span className="text-slate-400">·</span>
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline font-medium"
            >
              Batal Pilihan
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-500 px-1.5">Set:</span>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('H')}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                title="Tandai Hadir untuk yang dicentang"
              >
                H
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('S')}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
                title="Tandai Sakit untuk yang dicentang"
              >
                S
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('I')}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                title="Tandai Izin untuk yang dicentang"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('A')}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
                title="Tandai Alpa untuk yang dicentang"
              >
                A
              </button>
            </div>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs shadow-2xs transition-colors"
            >
              {isAllSelected ? 'Hapus Centang Semua' : `Centang Semua (${classStudents.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedAttendance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus / Kosongkan Absensi {selectedStudentIds.length === classStudents.length ? 'Semua Murid' : `(${selectedStudentIds.length})`}
            </button>
          </div>
        </div>
      )}

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
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    title="Centang untuk memilih/menghapus semua absensi"
                  />
                </th>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4 w-28">NIS</th>
                <th className="py-2.5 px-4">Nama Murid</th>
                <th className="py-2.5 px-4 text-center w-64">Status Kehadiran</th>
                <th className="py-2.5 px-4">Keterangan Tambahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.length > 0 ? (
                classStudents.map((student, idx) => {
                  const current = studentStatuses[student.id] || { status: 'H', notes: '' };
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(student.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          title="Pilih murid ini"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {student.nis}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {(['H', 'S', 'I', 'A'] as AttendanceStatus[]).map((st) => {
                            const isSelected = current.status === st;
                            const colors = {
                              H: isSelected ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400',
                              S: isSelected ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400',
                              I: isSelected ? 'bg-amber-500 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400',
                              A: isSelected ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400',
                            }[st];

                            const labels = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alpa' }[st];

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(student.id, st)}
                                title={labels}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${colors}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={current.notes}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="Catatan surat izin, terlambat, dll..."
                          className="w-full text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    Belum ada murid aktif yang terdaftar di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Pastikan status kehadiran telah akurat sebelum menekan Simpan.
            </span>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
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
