import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  Users,
  Search,
  Calculator,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  KnowledgeAssessment,
  AppSettings,
} from '../../types';

interface KnowledgeAssessmentViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  existingAssessments: KnowledgeAssessment[];
  onSaveAssessmentBatch: (records: KnowledgeAssessment[]) => Promise<void>;
  onDeleteAssessment: (id: string) => Promise<void>;
  onBatchDeleteAssessments?: (ids: string[]) => Promise<void>;
}

export const KnowledgeAssessmentView: React.FC<KnowledgeAssessmentViewProps> = ({
  students,
  classes,
  settings,
  existingAssessments,
  onSaveAssessmentBatch,
  onDeleteAssessment,
  onBatchDeleteAssessments,
}) => {
  const assessmentTypes: KnowledgeAssessment['assessmentType'][] = [
    'Formatif',
    'Sumatif',
    'Tugas',
    'Ulangan Harian',
    'PTS',
    'PAS',
    'Lainnya',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters / Parameters
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(settings.subject || 'Matematika');
  const [topic, setTopic] = useState<string>('Limit & Turunan Fungsi');
  const [assessmentType, setAssessmentType] = useState<KnowledgeAssessment['assessmentType']>('Formatif');
  const [assessmentDate, setAssessmentDate] = useState<string>(todayStr);

  // Student scores local edit state: { [studentId]: { score: number, notes: string } }
  const [scoresMap, setScoresMap] = useState<Record<string, { score: number; notes: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Active students for selected class
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // Load existing saved scores when class, topic, or assessmentType changes
  useEffect(() => {
    const map: Record<string, { score: number; notes: string }> = {};

    classStudents.forEach((st) => {
      // Find matching existing record
      const found = existingAssessments.find(
        (a) =>
          a.classId === selectedClassId &&
          a.subject === subject &&
          a.topic === topic &&
          a.assessmentType === assessmentType &&
          a.studentId === st.id
      );

      if (found) {
        map[st.id] = { score: found.score, notes: found.notes || '' };
      } else {
        map[st.id] = { score: 80, notes: '' };
      }
    });

    setScoresMap(map);
    setSaveSuccessMsg(null);
  }, [selectedClassId, subject, topic, assessmentType, classStudents, existingAssessments]);

  const handleScoreChange = (studentId: string, val: number) => {
    const clamped = Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
    setScoresMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: clamped,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setScoresMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  // Filtered students for display search
  const displayedStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm)
  );

  // Calculate live average
  const averageScore = useMemo(() => {
    if (classStudents.length === 0) return 0;
    const total = classStudents.reduce((sum, s) => sum + (scoresMap[s.id]?.score || 0), 0);
    return Math.round((total / classStudents.length) * 10) / 10;
  }, [classStudents, scoresMap]);

  const isAllSelected = displayedStudents.length > 0 && displayedStudents.every((s) => selectedStudentIds.includes(s.id));
  const isSomeSelected = selectedStudentIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(displayedStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    if (confirm(`Apakah Anda yakin ingin menghapus/mengosongkan nilai untuk ${count} murid yang dicentang?`)) {
      const recordIdsToDelete: string[] = [];
      selectedStudentIds.forEach((studentId) => {
        const found = existingAssessments.find(
          (a) =>
            a.classId === selectedClassId &&
            a.subject === subject &&
            a.topic === topic &&
            a.assessmentType === assessmentType &&
            a.studentId === studentId
        );
        if (found) recordIdsToDelete.push(found.id);
      });

      if (recordIdsToDelete.length > 0) {
        if (onBatchDeleteAssessments) {
          await onBatchDeleteAssessments(recordIdsToDelete);
        } else {
          for (const id of recordIdsToDelete) {
            await onDeleteAssessment(id);
          }
        }
      }

      setScoresMap((prev) => {
        const next = { ...prev };
        selectedStudentIds.forEach((sid) => {
          next[sid] = { score: 0, notes: '' };
        });
        return next;
      });

      setSelectedStudentIds([]);
      setSaveSuccessMsg(`${count} nilai murid berhasil dihapus/dikosongkan.`);
    }
  };

  // Save handler
  const handleSave = async () => {
    if (classStudents.length === 0) {
      alert('Tidak ada murid pada kelas ini.');
      return;
    }
    if (!topic.trim()) {
      alert('Mohon isi materi asesmen.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const recordsToSave: KnowledgeAssessment[] = classStudents.map((student) => {
        const item = scoresMap[student.id] || { score: 80, notes: '' };
        const existing = existingAssessments.find(
          (a) =>
            a.classId === selectedClassId &&
            a.subject === subject &&
            a.topic === topic &&
            a.assessmentType === assessmentType &&
            a.studentId === student.id
        );

        return {
          id: existing ? existing.id : `kn-${selectedClassId}-${assessmentType}-${topic.replace(/\s+/g, '_')}-${student.id}`,
          date: assessmentDate,
          classId: selectedClassId,
          subject,
          topic,
          assessmentType,
          studentId: student.id,
          studentName: student.name,
          score: item.score,
          notes: item.notes,
          academicYear: settings.academicYear,
          semester: settings.semester,
        };
      });

      await onSaveAssessmentBatch(recordsToSave);
      setSaveSuccessMsg(`Nilai pengetahuan "${topic}" (${assessmentType}) berhasil disimpan!`);
    } catch (e: any) {
      alert('Gagal menyimpan nilai: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Penilaian Pengetahuan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola nilai formatif, sumatif, tugas, dan ulangan dengan perhitungan rata-rata kelas otomatis (skala 0–100).
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving || classStudents.length === 0}
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Filter / Setting Parameter Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Parameter Asesmen Pengetahuan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Jenis Asesmen
            </label>
            <select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {assessmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Materi / Pokok Bahasan
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Limit Fungsi"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tanggal Penilaian
            </label>
            <input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Average summary card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
              Statistik Nilai Kelas {classes.find((c) => c.id === selectedClassId)?.name}
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Materi: <span className="font-semibold">{topic}</span> ({assessmentType}) · {classStudents.length} murid dinilai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-blue-800 dark:text-blue-300 block">Rata-rata Kelas:</span>
            <span className="text-2xl font-bold text-blue-950 dark:text-white font-mono tabular-nums">
              {averageScore}
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {selectedStudentIds.length} murid dicentang
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              dari total {displayedStudents.length} murid
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
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs shadow-2xs transition-colors"
            >
              {isAllSelected ? 'Hapus Centang Semua' : `Centang Semua (${displayedStudents.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus / Kosongkan Nilai {selectedStudentIds.length === displayedStudents.length ? 'Semua Murid' : `(${selectedStudentIds.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Scores Input Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            Daftar Input Nilai Murid
          </span>
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari murid..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden dark:placeholder-slate-500"
            />
          </div>
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
                    title="Centang untuk memilih/menghapus semua nilai"
                  />
                </th>
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-4 w-28">NIS</th>
                <th className="py-2.5 px-4">Nama Murid</th>
                <th className="py-2.5 px-4 w-36 text-center">Nilai (0 - 100)</th>
                <th className="py-2.5 px-4">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedStudents.length > 0 ? (
                displayedStudents.map((student, idx) => {
                  const item = scoresMap[student.id] || { score: 80, notes: '' };
                  const isRemedial = item.score < 75;
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
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {student.nis}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.score}
                            onChange={(e) => handleScoreChange(student.id, Number(e.target.value))}
                            className={`w-20 text-center font-mono font-bold text-xs px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 tabular-nums ${
                              isRemedial
                                ? 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-800'
                            }`}
                          />
                          {isRemedial && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 rounded">
                              Remedial
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="Tuntas / Perlu bimbingan soal..."
                          className="w-full text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    Tidak ada murid pada kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Rata-rata: <span className="font-bold font-mono text-slate-900 dark:text-white">{averageScore}</span>
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Nilai Pengetahuan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
