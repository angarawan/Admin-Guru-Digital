import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  Save,
  CheckCircle2,
  Users,
  Search,
  HelpCircle,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  AttitudeAssessment,
  AppSettings,
} from '../../types';

interface AttitudeAssessmentViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  existingAssessments: AttitudeAssessment[];
  onSaveAssessmentBatch: (records: AttitudeAssessment[]) => Promise<void>;
  onDeleteAssessment: (id: string) => Promise<void>;
}

export const AttitudeAssessmentView: React.FC<AttitudeAssessmentViewProps> = ({
  students,
  classes,
  settings,
  existingAssessments,
  onSaveAssessmentBatch,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Parameters
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(settings.subject || 'Matematika');
  const [observationDate, setObservationDate] = useState<string>(todayStr);

  // Attitude criteria
  const defaultCriteria = [
    { key: 'discipline', label: 'Disiplin' },
    { key: 'responsibility', label: 'Tanggung Jawab' },
    { key: 'cooperation', label: 'Kerja Sama' },
    { key: 'sportsmanship', label: 'Sportivitas' },
    { key: 'confidence', label: 'Percaya Diri' },
  ];

  // Students attitudes edit map: { [studentId]: { scores: Record<string, number>, behaviorNotes: string, resultSummary: string } }
  const [attitudeMap, setAttitudeMap] = useState<
    Record<
      string,
      {
        scores: Record<string, number>;
        behaviorNotes: string;
        resultSummary: string;
      }
    >
  >({});

  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // Compute category label from average score
  const getCategoryLabel = (scores: Record<string, number>): string => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 'BSH';
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 3.5) return 'Sangat Berkembang (SB)';
    if (avg >= 2.6) return 'Berkembang Sesuai Harapan (BSH)';
    if (avg >= 1.8) return 'Mulai Berkembang (MB)';
    return 'Perlu Bimbingan (PB)';
  };

  useEffect(() => {
    const map: Record<
      string,
      {
        scores: Record<string, number>;
        behaviorNotes: string;
        resultSummary: string;
      }
    > = {};

    classStudents.forEach((st) => {
      const found = existingAssessments.find(
        (a) =>
          a.classId === selectedClassId &&
          a.observationDate === observationDate &&
          a.studentId === st.id
      );

      if (found) {
        map[st.id] = {
          scores: { ...found.scores },
          behaviorNotes: found.behaviorNotes || '',
          resultSummary: found.resultSummary || getCategoryLabel(found.scores),
        };
      } else {
        const defaultScores = {
          discipline: 3,
          responsibility: 3,
          cooperation: 3,
          sportsmanship: 3,
          confidence: 3,
        };
        map[st.id] = {
          scores: defaultScores,
          behaviorNotes: 'Menunjukkan sikap positif dan aktif berkolaborasi.',
          resultSummary: 'Berkembang Sesuai Harapan (BSH)',
        };
      }
    });

    setAttitudeMap(map);
    setSaveSuccessMsg(null);
  }, [selectedClassId, observationDate, classStudents, existingAssessments]);

  const handleScoreChange = (studentId: string, criteriaKey: string, score: number) => {
    setAttitudeMap((prev) => {
      const current = prev[studentId] || {
        scores: { discipline: 3, responsibility: 3, cooperation: 3, sportsmanship: 3, confidence: 3 },
        behaviorNotes: '',
        resultSummary: '',
      };
      const updatedScores = {
        ...current.scores,
        [criteriaKey]: score,
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          scores: updatedScores,
          resultSummary: getCategoryLabel(updatedScores),
        },
      };
    });
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttitudeMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        behaviorNotes: notes,
      },
    }));
  };

  const handleSave = async () => {
    if (classStudents.length === 0) {
      alert('Tidak ada murid pada kelas ini.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const recordsToSave: AttitudeAssessment[] = classStudents.map((st) => {
        const item = attitudeMap[st.id] || {
          scores: { discipline: 3, responsibility: 3, cooperation: 3, sportsmanship: 3, confidence: 3 },
          behaviorNotes: '',
          resultSummary: 'Berkembang Sesuai Harapan (BSH)',
        };

        const existing = existingAssessments.find(
          (a) =>
            a.classId === selectedClassId &&
            a.observationDate === observationDate &&
            a.studentId === st.id
        );

        return {
          id: existing ? existing.id : `at-${selectedClassId}-${observationDate}-${st.id}`,
          date: observationDate,
          classId: selectedClassId,
          subject,
          studentId: st.id,
          studentName: st.name,
          scores: {
            discipline: item.scores.discipline || 3,
            responsibility: item.scores.responsibility || 3,
            cooperation: item.scores.cooperation || 3,
            sportsmanship: item.scores.sportsmanship || 3,
            confidence: item.scores.confidence || 3,
          },
          behaviorNotes: item.behaviorNotes,
          observationDate,
          resultSummary: item.resultSummary || getCategoryLabel(item.scores),
          academicYear: settings.academicYear,
          semester: settings.semester,
        };
      });

      await onSaveAssessmentBatch(recordsToSave);
      setSaveSuccessMsg(`Observasi penilaian sikap tanggal ${observationDate} berhasil disimpan!`);
    } catch (e: any) {
      alert('Gagal menyimpan nilai sikap: ' + e.message);
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
            <HeartHandshake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Penilaian Sikap
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Observasi perkembangan sikap spiritual & sosial murid (Disiplin, Tanggung Jawab, Kerja Sama, Sportivitas, Percaya Diri).
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving || classStudents.length === 0}
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Menyimpan...' : 'Simpan Nilai Sikap'}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tanggal Observasi</label>
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-white">Keterangan Skor:</span>
          <span><strong className="text-emerald-700 dark:text-emerald-400">4</strong> = Sangat Berkembang (SB)</span>
          <span><strong className="text-blue-700 dark:text-blue-400">3</strong> = Berkembang Sesuai Harapan (BSH)</span>
          <span><strong className="text-amber-700 dark:text-amber-400">2</strong> = Mulai Berkembang (MB)</span>
          <span><strong className="text-rose-700 dark:text-rose-400">1</strong> = Perlu Bimbingan (PB)</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 w-28">NIS</th>
                <th className="py-2.5 px-3">Nama Murid</th>
                {defaultCriteria.map((c) => (
                  <th key={c.key} className="py-2.5 px-2 text-center w-24">
                    {c.label}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center w-36">Kesimpulan</th>
                <th className="py-2.5 px-3">Catatan Perilaku & Pengamatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.map((st, idx) => {
                const item = attitudeMap[st.id] || {
                  scores: { discipline: 3, responsibility: 3, cooperation: 3, sportsmanship: 3, confidence: 3 },
                  behaviorNotes: '',
                  resultSummary: 'BSH',
                };

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                      {st.nis}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    {defaultCriteria.map((c) => {
                      const score = item.scores[c.key] || 3;
                      return (
                        <td key={c.key} className="py-2 px-2 text-center">
                          <select
                            value={score}
                            onChange={(e) =>
                              handleScoreChange(st.id, c.key, Number(e.target.value))
                            }
                            className="w-14 text-center text-xs font-mono font-bold py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500 tabular-nums"
                          >
                            <option value={4}>4 (SB)</option>
                            <option value={3}>3 (BSH)</option>
                            <option value={2}>2 (MB)</option>
                            <option value={1}>1 (PB)</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                        {item.resultSummary}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.behaviorNotes}
                        onChange={(e) => handleNotesChange(st.id, e.target.value)}
                        placeholder="Contoh: Sangat bertanggung jawab dalam tugas piket kelompok..."
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
              Data sikap disimpan permanen dan dapat direkap berdasarkan rentang semester.
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Nilai Sikap'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
