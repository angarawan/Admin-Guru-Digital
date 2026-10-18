import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Save,
  CheckCircle2,
  Users,
  Search,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  SkillAssessment,
  SkillAssessmentIndicator,
  AppSettings,
} from '../../types';

interface SkillAssessmentViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  existingAssessments: SkillAssessment[];
  onSaveAssessmentBatch: (records: SkillAssessment[]) => Promise<void>;
  onDeleteAssessment: (id: string) => Promise<void>;
  onBatchDeleteAssessments?: (ids: string[]) => Promise<void>;
}

export const SkillAssessmentView: React.FC<SkillAssessmentViewProps> = ({
  students,
  classes,
  settings,
  existingAssessments,
  onSaveAssessmentBatch,
  onDeleteAssessment,
  onBatchDeleteAssessments,
}) => {
  const practiceTypes = [
    'Praktik Laboratorium / Eksperimen',
    'Presentasi / Diskusi Terbuka',
    'Projek Kolaboratif / Produk',
    'Portofolio Hasil Belajar',
    'Simulasi / Demonstrasi Digital',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  // Parameters
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(settings.subject || 'Matematika');
  const [topic, setTopic] = useState<string>('Visualisasi Grafik Trigonometri');
  const [practiceType, setPracticeType] = useState<string>(practiceTypes[0]);
  const [assessmentDate, setAssessmentDate] = useState<string>(todayStr);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Indicators list (score 1-4, weight)
  const [indicators, setIndicators] = useState<Array<{ name: string; weight: number }>>([
    { name: 'Kesesuaian Prosedur / Langkah Kerja', weight: 1 },
    { name: 'Ketepatan Analisis & Perhitungan', weight: 1 },
    { name: 'Kreativitas Solusi', weight: 1 },
    { name: 'Kerapian & Sistematika Hasil', weight: 1 },
    { name: 'Komunikasi / Presentasi', weight: 1 },
  ]);

  // Scores map: { [studentId]: { scores: number[], feedback: string, notes: string } }
  const [studentGrades, setStudentGrades] = useState<
    Record<string, { scores: number[]; feedback: string; notes: string }>
  >({});

  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter students by active & class
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // Calculate final score helper (0 - 100)
  const calculateFinalScore = (scores: number[]): number => {
    let weightedSum = 0;
    let maxWeightedSum = 0;

    indicators.forEach((ind, idx) => {
      const score = scores[idx] || 3;
      weightedSum += score * ind.weight;
      maxWeightedSum += 4 * ind.weight;
    });

    if (maxWeightedSum === 0) return 0;
    return Math.round((weightedSum / maxWeightedSum) * 100);
  };

  // Sync state when parameters change
  useEffect(() => {
    const map: Record<string, { scores: number[]; feedback: string; notes: string }> = {};

    classStudents.forEach((st) => {
      const found = existingAssessments.find(
        (a) =>
          a.classId === selectedClassId &&
          a.topic === topic &&
          a.practiceType === practiceType &&
          a.studentId === st.id
      );

      if (found && Array.isArray(found.indicators)) {
        map[st.id] = {
          scores: found.indicators.map((i) => i.score),
          feedback: found.feedback || '',
          notes: found.notes || '',
        };
      } else {
        map[st.id] = {
          scores: indicators.map(() => 3), // default 3 (Berkembang Sesuai Harapan)
          feedback: 'Kerja bagus, tingkatkan ketelitian.',
          notes: 'Tuntas',
        };
      }
    });

    setStudentGrades(map);
    setSaveSuccessMsg(null);
  }, [selectedClassId, topic, practiceType, classStudents, indicators.length, existingAssessments]);

  const handleScoreChange = (studentId: string, indicatorIdx: number, val: number) => {
    const clamped = Math.min(4, Math.max(1, val));
    setStudentGrades((prev) => {
      const current = prev[studentId] || {
        scores: indicators.map(() => 3),
        feedback: '',
        notes: '',
      };
      const newScores = [...current.scores];
      newScores[indicatorIdx] = clamped;
      return {
        ...prev,
        [studentId]: {
          ...current,
          scores: newScores,
        },
      };
    });
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setStudentGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        feedback,
      },
    }));
  };

  const handleAddIndicator = () => {
    const name = prompt('Masukkan nama indikator penilaian baru:');
    if (name && name.trim()) {
      setIndicators((prev) => [...prev, { name: name.trim(), weight: 1 }]);
    }
  };

  const handleRemoveIndicator = (idx: number) => {
    if (indicators.length <= 1) {
      alert('Minimal harus ada 1 indikator penilaian.');
      return;
    }
    setIndicators((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (classStudents.length === 0) {
      alert('Tidak ada murid pada kelas yang dipilih.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const recordsToSave: SkillAssessment[] = classStudents.map((st) => {
        const item = studentGrades[st.id] || {
          scores: indicators.map(() => 3),
          feedback: '',
          notes: '',
        };

        const indList: SkillAssessmentIndicator[] = indicators.map((ind, i) => ({
          name: ind.name,
          score: item.scores[i] || 3,
          weight: ind.weight,
        }));

        const finalScore = calculateFinalScore(item.scores);
        const existing = existingAssessments.find(
          (a) =>
            a.classId === selectedClassId &&
            a.topic === topic &&
            a.practiceType === practiceType &&
            a.studentId === st.id
        );

        return {
          id: existing ? existing.id : `sk-${selectedClassId}-${topic.replace(/\s+/g, '_')}-${st.id}`,
          date: assessmentDate,
          classId: selectedClassId,
          subject,
          topic,
          practiceType,
          studentId: st.id,
          studentName: st.name,
          indicators: indList,
          finalScore,
          notes: item.notes,
          feedback: item.feedback,
          academicYear: settings.academicYear,
          semester: settings.semester,
        };
      });

      await onSaveAssessmentBatch(recordsToSave);
      setSaveSuccessMsg(`Penilaian keterampilan "${topic}" berhasil disimpan!`);
    } catch (err: any) {
      alert('Gagal menyimpan nilai keterampilan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
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

  const handleDeleteSelected = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    if (confirm(`Apakah Anda yakin ingin menghapus/mengosongkan nilai keterampilan untuk ${count} murid yang dicentang?`)) {
      const recordIdsToDelete: string[] = [];
      selectedStudentIds.forEach((studentId) => {
        const found = existingAssessments.find(
          (a) =>
            a.classId === selectedClassId &&
            a.topic === topic &&
            a.practiceType === practiceType &&
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

      setStudentGrades((prev) => {
        const next = { ...prev };
        selectedStudentIds.forEach((sid) => {
          next[sid] = {
            scores: indicators.map(() => 1),
            feedback: '',
            notes: '',
          };
        });
        return next;
      });

      setSelectedStudentIds([]);
      setSaveSuccessMsg(`${count} penilaian keterampilan berhasil dihapus/dikosongkan.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Penilaian Keterampilan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Penilaian unjuk kerja, presentasi, dan projek dengan rubrik berbobot skala 1–4 otomatis dikonversi ke skala 0–100.
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

      {/* Parameter Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Parameter Praktik & Keterampilan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kelas</label>
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Bentuk Praktik</label>
            <select
              value={practiceType}
              onChange={(e) => setPracticeType(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {practiceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Materi / Topik</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
            <input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Rubric Indicators Customization Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rubrik Indikator Penilaian ({indicators.length} Kriteria, Skor 1–4):
            </span>
            <button
              type="button"
              onClick={handleAddIndicator}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Indikator
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {indicators.map((ind, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400">{i + 1}.</span>
                <span>{ind.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({ind.weight}x)</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIndicator(i)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1"
                  title="Hapus kriteria ini"
                >
                  ×
                </button>
              </span>
            ))}
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
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs shadow-2xs transition-colors"
            >
              {isAllSelected ? 'Hapus Centang Semua' : `Centang Semua (${classStudents.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus / Kosongkan Nilai {selectedStudentIds.length === classStudents.length ? 'Semua Murid' : `(${selectedStudentIds.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Table of Skill Assessments */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
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
                <th className="py-2.5 px-3 w-28">NIS</th>
                <th className="py-2.5 px-3">Nama Murid</th>
                {indicators.map((ind, i) => (
                  <th key={i} className="py-2.5 px-2 text-center w-20" title={ind.name}>
                    Ind {i + 1}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center w-24">Nilai Akhir (0-100)</th>
                <th className="py-2.5 px-3">Umpan Balik / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.map((st, idx) => {
                const item = studentGrades[st.id] || {
                  scores: indicators.map(() => 3),
                  feedback: '',
                  notes: '',
                };
                const final = calculateFinalScore(item.scores);
                const isSelected = selectedStudentIds.includes(st.id);

                return (
                  <tr
                    key={st.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(st.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                      {st.nis}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    {indicators.map((_, i) => {
                      const score = item.scores[i] || 3;
                      return (
                        <td key={i} className="py-2 px-2 text-center">
                          <select
                            value={score}
                            onChange={(e) =>
                              handleScoreChange(st.id, i, Number(e.target.value))
                            }
                            className="w-12 text-center text-xs font-mono font-bold py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500 tabular-nums"
                          >
                            <option value={4}>4 (SB)</option>
                            <option value={3}>3 (B)</option>
                            <option value={2}>2 (C)</option>
                            <option value={1}>1 (K)</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center">
                      <span className="font-mono font-bold text-sm text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60 tabular-nums">
                        {final}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.feedback}
                        onChange={(e) => handleFeedbackChange(st.id, e.target.value)}
                        placeholder="Umpan balik konstruktif..."
                        className="w-full text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Skor Indikator: 4 = Sangat Baik, 3 = Baik, 2 = Cukup, 1 = Perlu Bimbingan.
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Nilai Keterampilan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
