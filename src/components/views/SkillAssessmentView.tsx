import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  Save,
  CheckCircle2,
  Users,
  Search,
  Plus,
  Trash2,
  Dices,
  UserCheck,
  Sparkles,
  X,
  Layers,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LayoutGrid,
  ListOrdered,
  Table as TableIcon,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  SkillAssessment,
  SkillAssessmentIndicator,
  AttendanceRecord,
  AppSettings,
} from '../../types';
import { normalizeClassKey } from '../../services/storage';

interface SkillAssessmentViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  existingAssessments: SkillAssessment[];
  attendance?: AttendanceRecord[];
  onSaveAssessmentBatch: (records: SkillAssessment[]) => Promise<void>;
  onDeleteAssessment: (id: string) => Promise<void>;
  onBatchDeleteAssessments?: (ids: string[]) => Promise<void>;
  onNavigateToDashboard?: () => void;
}

export const SkillAssessmentView: React.FC<SkillAssessmentViewProps> = ({
  students,
  classes,
  settings,
  existingAssessments,
  attendance = [],
  onSaveAssessmentBatch,
  onDeleteAssessment,
  onBatchDeleteAssessments,
  onNavigateToDashboard,
}) => {
  const practiceTypes = [
    'Praktik Gerak Dasar / Unjuk Kerja',
    'Permainan Bola Besar (Sepak Bola / Basket / Voli)',
    'Permainan Bola Kecil (Bulu Tangkis / Tenis Meja)',
    'Aktivitas Atletik (Lari / Lompat / Lempar)',
    'Aktivitas Kebugaran Jasmani',
    'Senam Lantai & Ketangkasan',
    'Aktivitas Renang & Air',
    'Presentasi / Diskusi PJOK',
  ];

  const feedbackPresets = [
    'Pelaksanaan gerak sangat baik, teknik terkoordinasi dengan rapi.',
    'Akurasi dan kelancaran gerak baik, pertahankan.',
    'Sikap awal dan akhir sudah tepat, perlu meningkatkan konsistensi gerak.',
    'Perlu bimbingan pada sikap tubuh dan keseimbangan saat bergerak.',
    'Perlu latihan intensif pada koordinasi kaki dan ayunan tangan.',
    'Gerakan aktif dan bersemangat, teknik dasar perlu dimatangkan.',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  // Parameters
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(settings.subject || 'PJOK');
  const [topic, setTopic] = useState<string>('Keterampilan Dribble & Passing');
  const [practiceType, setPracticeType] = useState<string>(practiceTypes[0]);
  const [assessmentDate, setAssessmentDate] = useState<string>(todayStr);

  // Keep selectedClassId synchronized when classes prop changes or if current id is not in classes
  useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.some((c) => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (settings.subject) {
      setSubject(settings.subject);
    }
  }, [settings.subject]);

  // Selected student IDs for evaluation (multi-select)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  // Dropdown open state for Langkah 2
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    if (isStudentDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isStudentDropdownOpen]);

  // View Layout Mode: 'by-indicator' (default per request) | 'by-student' | 'table'
  const [viewMode, setViewMode] = useState<'by-indicator' | 'by-student' | 'table'>('by-indicator');

  // Indicators list (score 1-4, weight)
  const [indicators, setIndicators] = useState<Array<{ name: string; weight: number }>>([
    { name: 'Teknik Gerakan Awal / Sikap Tubuh', weight: 1 },
    { name: 'Pelaksanaan Gerak / Akurasi', weight: 1 },
    { name: 'Konsistensi & Kelancaran Gerak', weight: 1 },
    { name: 'Sikap Akhir & Keseimbangan', weight: 1 },
  ]);

  // Scores map: { [studentId]: { scores: number[], feedback: string, notes: string } }
  const [studentGrades, setStudentGrades] = useState<
    Record<string, { scores: number[]; feedback: string; notes: string }>
  >({});

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [randomAnimationStudent, setRandomAnimationStudent] = useState<Student | null>(null);

  // Track student IDs saved in the current session
  const [sessionSavedStudentIds, setSessionSavedStudentIds] = useState<string[]>([]);
  // Filter tab for student selection in Langkah 2: 'ungraded' (default) | 'graded' | 'all'
  const [filterGradedStatus, setFilterGradedStatus] = useState<'ungraded' | 'all' | 'graded'>('ungraded');

  // All active students for selected class (sorted alphabetically with class name & normalized fallback)
  const classStudents = useMemo(() => {
    const curCls = classes.find((c) => c.id === selectedClassId);
    return students
      .filter((s) => {
        if (!s.isActive) return false;
        if (s.classId === selectedClassId) return true;
        if (curCls) {
          if (s.classId.toLowerCase() === curCls.name.toLowerCase()) return true;
          return (
            normalizeClassKey(s.classId) === normalizeClassKey(curCls.name) ||
            normalizeClassKey(s.classId) === normalizeClassKey(curCls.id)
          );
        }
        return false;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
  }, [students, selectedClassId, classes]);

  // Set of student IDs already evaluated & saved for this class, topic, and practice type
  const alreadyGradedStudentIds = useMemo(() => {
    const set = new Set<string>(sessionSavedStudentIds);
    existingAssessments.forEach((a) => {
      if (
        a.classId === selectedClassId &&
        a.topic === topic &&
        a.practiceType === practiceType
      ) {
        set.add(a.studentId);
      }
    });
    return set;
  }, [existingAssessments, selectedClassId, topic, practiceType, sessionSavedStudentIds]);

  // Ungraded students (haven't been evaluated yet for this topic)
  const ungradedStudents = useMemo(() => {
    return classStudents.filter((s) => !alreadyGradedStudentIds.has(s.id));
  }, [classStudents, alreadyGradedStudentIds]);

  // Graded students (already evaluated and saved)
  const gradedStudents = useMemo(() => {
    return classStudents.filter((s) => alreadyGradedStudentIds.has(s.id));
  }, [classStudents, alreadyGradedStudentIds]);

  // Students marked as "Hadir" (H) in attendance
  const presentStudentIds = useMemo(() => {
    const dateRecords = attendance.filter(
      (a) => a.classId === selectedClassId && a.date === assessmentDate
    );

    if (dateRecords.length > 0) {
      return new Set(dateRecords.filter((r) => r.status === 'H').map((r) => r.studentId));
    }

    // Fallback: look for the latest attendance date for this class
    const classRecords = attendance.filter((a) => a.classId === selectedClassId);
    if (classRecords.length > 0) {
      const dates = Array.from(new Set(classRecords.map((r) => r.date))).sort().reverse();
      const latestDate = dates[0];
      return new Set(
        classRecords
          .filter((r) => r.date === latestDate && r.status === 'H')
          .map((r) => r.studentId)
      );
    }

    return new Set<string>();
  }, [attendance, selectedClassId, assessmentDate]);

  // Filtered student list displayed in dropdown based on filter tab and search term
  const displayClassStudents = useMemo(() => {
    let list = classStudents;
    if (filterGradedStatus === 'ungraded') {
      list = ungradedStudents;
    } else if (filterGradedStatus === 'graded') {
      list = gradedStudents;
    }
    if (!studentSearchTerm.trim()) return list;
    const q = studentSearchTerm.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [classStudents, ungradedStudents, gradedStudents, filterGradedStatus, studentSearchTerm]);

  // Actual selected student objects currently being evaluated
  const chosenStudents = useMemo(() => {
    return classStudents.filter((s) => selectedStudentIds.includes(s.id));
  }, [classStudents, selectedStudentIds]);

  // Calculate final score mapped to rubric brackets & randomized with daily attendance sync:
  // Rubric 4: 86 - 90
  // Rubric 3: 81 - 85
  // Rubric 2: 75 - 80
  // Rubric 1: 70 - 74
  const calculateFinalScore = (scores: number[], studentId?: string): number => {
    let weightedSum = 0;
    let maxWeightedSum = 0;

    indicators.forEach((ind, idx) => {
      const score = scores[idx] !== undefined ? scores[idx] : 3;
      weightedSum += score * ind.weight;
      maxWeightedSum += 4 * ind.weight;
    });

    if (maxWeightedSum === 0) return 80;

    // Average rubric rating (1.0 to 4.0)
    const avgRating = (weightedSum / maxWeightedSum) * 4;

    // Mapped score ranges based on user specifications:
    // 4 -> 86-90, 3 -> 81-85, 2 -> 75-80, 1 -> 70-74
    let minScore = 81;
    let maxScore = 85;

    if (avgRating >= 3.5) {
      minScore = 86;
      maxScore = 90;
    } else if (avgRating >= 2.5) {
      minScore = 81;
      maxScore = 85;
    } else if (avgRating >= 1.5) {
      minScore = 75;
      maxScore = 80;
    } else {
      minScore = 70;
      maxScore = 74;
    }

    // Attendance synchronization:
    // Analyze student's daily attendance records in this class
    let attendanceRate = 0.9;
    if (studentId) {
      const stAttendance = attendance.filter((a) => a.studentId === studentId);
      if (stAttendance.length > 0) {
        const hadirCount = stAttendance.filter((a) => a.status === 'H').length;
        attendanceRate = hadirCount / stAttendance.length;
      }
    }

    // Deterministic pseudo-random variation based on student ID, topic, and date
    // Ensures scores are pleasantly randomized within the bracket without bouncing on re-renders
    const seed = `${studentId || 'std'}-${topic}-${assessmentDate || ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const pseudoRand = Math.abs(Math.sin(hash + 3141.59) * 10000) % 1;

    // Blend: 70% attendance factor + 30% randomized jitter
    const factor = Math.min(1, Math.max(0, attendanceRate * 0.7 + pseudoRand * 0.3));
    const finalScore = Math.round(minScore + factor * (maxScore - minScore));

    return Math.min(maxScore, Math.max(minScore, finalScore));
  };

  // Helper score label
  const getScoreLabel = (score: number): string => {
    switch (score) {
      case 1:
        return 'Perlu Bimbingan';
      case 2:
        return 'Cukup';
      case 3:
        return 'Baik';
      case 4:
        return 'Sangat Baik';
      default:
        return '-';
    }
  };

  // Score button styling when active
  const getActiveButtonClass = (score: number): string => {
    switch (score) {
      case 1:
        return 'bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-400/40 ring-offset-1 font-black scale-105';
      case 2:
        return 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40 ring-offset-1 font-black scale-105';
      case 3:
        return 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/40 ring-offset-1 font-black scale-105';
      case 4:
        return 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40 ring-offset-1 font-black scale-105';
      default:
        return '';
    }
  };

  // Initialize grades and default student selection when parameters change
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
          feedback: found.feedback || feedbackPresets[1],
          notes: found.notes || 'Tuntas',
        };
      } else {
        map[st.id] = {
          scores: indicators.map(() => 3), // default 3 (Baik)
          feedback: feedbackPresets[1],
          notes: 'Tuntas',
        };
      }
    });

    setStudentGrades(map);
    setSaveSuccessMsg(null);

    // Keep selected IDs valid for current class
    if (classStudents.length > 0) {
      const existingIds = new Set(classStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => existingIds.has(id)));
    } else {
      setSelectedStudentIds([]);
    }
  }, [selectedClassId, topic, practiceType, classStudents.length, indicators.length, existingAssessments]);

  // Click 1-4 indicator score for student
  const handleScoreChange = (studentId: string, indicatorIdx: number, val: number) => {
    const clamped = Math.min(4, Math.max(1, val));
    setStudentGrades((prev) => {
      const current = prev[studentId] || {
        scores: indicators.map(() => 3),
        feedback: feedbackPresets[1],
        notes: 'Tuntas',
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
    const name = prompt('Masukkan nama kriteria / indikator penilaian:');
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

  // Student selection helpers
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    const pool = filterGradedStatus === 'ungraded' ? ungradedStudents : classStudents;
    if (pool.length === 0) {
      alert('Semua murid sudah dinilai untuk materi ini.');
      return;
    }
    setSelectedStudentIds(pool.map((s) => s.id));
  };

  const handleDeselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleSelectPresentStudents = () => {
    const pool = filterGradedStatus === 'ungraded' ? ungradedStudents : classStudents;
    const ids = pool.filter((s) => presentStudentIds.has(s.id)).map((s) => s.id);
    if (ids.length > 0) {
      setSelectedStudentIds(ids);
    } else {
      alert('Tidak ada murid hadir yang belum dinilai pada tanggal ini.');
    }
  };

  // Group selection (e.g. 3 or 5 students taking a turn)
  const handleSelectBatchGroup = (batchSize: number) => {
    const pool = filterGradedStatus === 'ungraded' ? ungradedStudents : classStudents;
    if (pool.length === 0) {
      alert('Semua murid sudah dinilai untuk materi ini.');
      return;
    }
    const currentlySelectedSet = new Set(selectedStudentIds);
    const unselected = pool.filter((s) => !currentlySelectedSet.has(s.id));
    if (unselected.length > 0) {
      setSelectedStudentIds(unselected.slice(0, batchSize).map((s) => s.id));
    } else {
      setSelectedStudentIds(pool.slice(0, batchSize).map((s) => s.id));
    }
  };

  // Pick random student or group
  const handlePickRandomStudent = () => {
    const pool = filterGradedStatus === 'ungraded' ? ungradedStudents : classStudents;
    if (pool.length === 0) {
      alert('Semua murid sudah dinilai untuk materi ini.');
      return;
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    setRandomAnimationStudent(chosen);
    setSelectedStudentIds([chosen.id]);
  };

  const handlePickRandomGroup = (count: number) => {
    const pool = filterGradedStatus === 'ungraded' ? ungradedStudents : classStudents;
    if (pool.length === 0) {
      alert('Semua murid sudah dinilai untuk materi ini.');
      return;
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count);
    setSelectedStudentIds(picked.map((s) => s.id));
    setRandomAnimationStudent(picked[0]);
  };

  // Apply default score (e.g. 3) to all selected students for current indicator
  const handleSetIndicatorScoreForAllSelected = (indicatorIdx: number, score: number) => {
    setStudentGrades((prev) => {
      const next = { ...prev };
      selectedStudentIds.forEach((sid) => {
        const cur = next[sid] || {
          scores: indicators.map(() => 3),
          feedback: feedbackPresets[1],
          notes: 'Tuntas',
        };
        const updatedScores = [...cur.scores];
        updatedScores[indicatorIdx] = score;
        next[sid] = {
          ...cur,
          scores: updatedScores,
        };
      });
      return next;
    });
  };

  const handleSave = async () => {
    const targetStudents = chosenStudents.length > 0 ? chosenStudents : classStudents;
    if (targetStudents.length === 0) {
      alert('Silakan pilih minimal 1 murid untuk dinilai.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const recordsToSave: SkillAssessment[] = targetStudents.map((st) => {
        const item = studentGrades[st.id] || {
          scores: indicators.map(() => 3),
          feedback: feedbackPresets[1],
          notes: 'Tuntas',
        };

        const indList: SkillAssessmentIndicator[] = indicators.map((ind, i) => ({
          name: ind.name,
          score: item.scores[i] || 3,
          weight: ind.weight,
        }));

        const finalScore = calculateFinalScore(item.scores, st.id);
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
          notes: item.notes || 'Tuntas',
          feedback: item.feedback || '',
          academicYear: settings.academicYear,
          semester: settings.semester,
        };
      });

      await onSaveAssessmentBatch(recordsToSave);
      const savedIds = targetStudents.map((s) => s.id);
      setSessionSavedStudentIds((prev) => Array.from(new Set([...prev, ...savedIds])));
      setSelectedStudentIds([]); // clear chosen students so teacher can choose other names without repetition
      setSaveSuccessMsg(
        `Nilai keterampilan untuk ${recordsToSave.length} murid berhasil disimpan! Mengalihkan ke menu dashboard...`
      );
      if (onNavigateToDashboard) {
        setTimeout(() => {
          onNavigateToDashboard();
        }, 1200);
      }
    } catch (err: any) {
      alert('Gagal menyimpan nilai keterampilan: ' + (err?.message || 'Terjadi kesalahan'));
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
            <Award className="w-5 h-5 text-amber-500" />
            Penilaian Keterampilan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Penilaian unjuk kerja & praktik PJOK. Tentukan indikator, pilih beberapa murid yang dinilai, lalu klik tombol angka terpisah 1–4 per indikator.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            disabled={isSaving || classStudents.length === 0}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* --- LANGKAH 1: PARAMETER & PENETAPAN INDIKATOR --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Langkah 1
            </span>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Parameter Pembelajaran & Indikator Penilaian
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddIndicator}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Indikator
          </button>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setRandomAnimationStudent(null);
              }}
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Materi / Topik Praktik</label>
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

        {/* Indicators List Badges */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Indikator yang dinilai ({indicators.length} kriteria):
          </div>
          <div className="flex flex-wrap gap-2">
            {indicators.map((ind, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium">{ind.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIndicator(i)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                  title="Hapus indikator ini"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- LANGKAH 2: MEMILIH BEBERAPA NAMA MURID YANG DINILAI --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Langkah 2
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Pilih Nama Murid yang Dinilai
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Buka dropdown di bawah untuk mencentang nama-nama murid yang akan dinilai pada Langkah 3.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-right sm:text-left">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                chosenStudents.length > 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {chosenStudents.length} murid dicentang
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              ({gradedStudents.length} sudah dinilai · {ungradedStudents.length} belum)
            </span>
          </div>
        </div>

        {/* Dropdown Multi-Select with Checkboxes */}
        <div className="relative pt-1" ref={dropdownRef}>
          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsStudentDropdownOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isStudentDropdownOpen
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800/80 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  chosenStudents.length > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                {chosenStudents.length === 0 ? (
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    -- Klik di sini untuk membuka dropdown & memilih nama murid ({ungradedStudents.length} belum dinilai) --
                  </span>
                ) : (
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {chosenStudents.length} Murid Dicentang
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate hidden sm:inline">
                      ({chosenStudents.map((s) => s.name).slice(0, 3).join(', ')}
                      {chosenStudents.length > 3 ? ` +${chosenStudents.length - 3} lainnya` : ''})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {chosenStudents.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {chosenStudents.length} Terpilih
                </span>
              )}
              {isStudentDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </button>

          {/* Dropdown Menu Panel */}
          {isStudentDropdownOpen && (
            <div className="absolute z-30 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 space-y-2.5 animate-in fade-in">
              {/* Filter Tabs: Belum Dinilai (default) vs Sudah Dinilai vs Semua */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setFilterGradedStatus('ungraded')}
                  className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-all cursor-pointer ${
                    filterGradedStatus === 'ungraded'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Belum Dinilai ({ungradedStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGradedStatus('graded')}
                  className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-all cursor-pointer ${
                    filterGradedStatus === 'graded'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sudah Dinilai ({gradedStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGradedStatus('all')}
                  className={`py-1 px-2.5 rounded-md font-semibold text-center transition-all cursor-pointer ${
                    filterGradedStatus === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua ({classStudents.length})
                </button>
              </div>

              {/* Search Inside Dropdown */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama murid dalam dropdown..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Quick Preset Actions inside Dropdown */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Users className="w-3 h-3 text-blue-500" />
                  Centang Semua ({filterGradedStatus === 'ungraded' ? ungradedStudents.length : classStudents.length})
                </button>

                <button
                  type="button"
                  onClick={handleSelectPresentStudents}
                  className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Centang Hadir
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBatchGroup(3)}
                  className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3 text-indigo-500" />
                  Giliran 3
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBatchGroup(5)}
                  className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3 text-indigo-500" />
                  Giliran 5
                </button>

                <button
                  type="button"
                  onClick={handlePickRandomStudent}
                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Dices className="w-3 h-3" />
                  Acak 1
                </button>

                {selectedStudentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAllStudents}
                    className="ml-auto text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                  >
                    Kosongkan Centang
                  </button>
                )}
              </div>

              {/* Scrollable Checkbox List (STRICTLY NO NIS) */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {displayClassStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                    {filterGradedStatus === 'ungraded' && ungradedStudents.length === 0 ? (
                      <>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Semua murid pada kelas ini sudah dinilai!
                        </div>
                        <div className="text-[11px]">
                          Pilih tab "Sudah Dinilai" di atas jika Anda ingin melihat kembali atau mengubah nilainya.
                        </div>
                      </>
                    ) : (
                      <div>Tidak ada nama murid yang cocok dengan "{studentSearchTerm}"</div>
                    )}
                  </div>
                ) : (
                  displayClassStudents.map((st, idx) => {
                    const isSelected = selectedStudentIds.includes(st.id);
                    const isPresent = presentStudentIds.has(st.id);
                    const isGraded = alreadyGradedStudentIds.has(st.id);

                    return (
                      <div
                        key={st.id}
                        onClick={() => handleToggleStudent(st.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors pt-2 first:pt-2 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Checkbox */}
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <span className="text-xs font-mono text-slate-400 w-5 tabular-nums shrink-0">
                            {idx + 1}.
                          </span>

                          {/* Student Name strictly without NIS */}
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                            {st.name}
                          </span>

                          {isPresent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                              Hadir
                            </span>
                          )}

                          {isGraded && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                              Sudah Dinilai
                            </span>
                          )}
                        </div>

                        <div className="shrink-0 ml-2">
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              Dicentang
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Belum
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total <strong>{chosenStudents.length}</strong> murid dicentang
                </span>
                <button
                  type="button"
                  onClick={() => setIsStudentDropdownOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Selesai Memilih
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Students Preview Chips */}
        {chosenStudents.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Murid yang dicentang untuk dinilai di Langkah 3 ({chosenStudents.length}):</span>
              <button
                type="button"
                onClick={handleDeselectAllStudents}
                className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-semibold"
              >
                Hapus Semua Centang
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-800">
              {chosenStudents.map((st) => (
                <span
                  key={st.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span>{st.name}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleStudent(st.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    title="Batal centang murid ini"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {randomAnimationStudent && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationIterationCount: 1, animationDuration: '0.4s' }} />
              <span className="font-bold text-amber-900 dark:text-amber-200">
                🎯 Murid Terpilih: {randomAnimationStudent.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRandomAnimationStudent(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* --- LANGKAH 3: PENILAIAN PER INDIKATOR (BARU DITAMPILKAN SETELAH NAMA MURID DICENTANG PADA LANGKAH 2) --- */}
      {chosenStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Langkah 3
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Lembar Penilaian Per Indikator Belum Ditampilkan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Silakan buka dropdown pada <strong>Langkah 2</strong> di atas dan centang beberapa nama murid yang akan dinilai. Setelah dicentang, penilaian per indikator dengan tombol nilai 1–4 terpisah akan langsung ditampilkan di sini.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsStudentDropdownOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Buka Dropdown Pilihan Murid
            </button>
            <button
              type="button"
              onClick={handleSelectAllStudents}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Centang Semua Murid ({classStudents.length})
            </button>
            {presentStudentIds.size > 0 && (
              <button
                type="button"
                onClick={handleSelectPresentStudents}
                className="px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold cursor-pointer"
              >
                Centang Yang Hadir ({presentStudentIds.size})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Navigation & Layout Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Langkah 3
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Penilaian Indikator (Tombol Terpisah 1–4)
              </span>
            </div>

            {/* View Mode Buttons */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('by-indicator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === 'by-indicator'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Per Indikator (Fokus Giliran)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('by-student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === 'by-student'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Per Murid (Kartu Siswa)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabel Ringkas</span>
              </button>
            </div>
          </div>


            {/* VIEW MODE 1: PER INDIKATOR (SESUAI PERMINTAAN USER) */}
            {/* "langsung sebelahnya tombol indikator 1 (1-4) pisahkan angkanya, di bawahnya ada lagi nama murid yang dipilih serta tombol indikator 2 dan seterusnya" */}
            {viewMode === 'by-indicator' && (
              <div className="space-y-4">
                {indicators.map((ind, indIdx) => (
                  <div
                    key={indIdx}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden"
                  >
                    {/* Header Indikator */}
                    <div className="p-3.5 bg-gradient-to-r from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                          {indIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              Indikator {indIdx + 1}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Skala Nilai 1 s/d 4
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {ind.name}
                          </h4>
                        </div>
                      </div>

                      {/* Quick preset for all selected students on this indicator */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Set Semua:</span>
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSetIndicatorScoreForAllSelected(indIdx, num)}
                            className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] transition-colors cursor-pointer"
                            title={`Set skor ${num} untuk semua murid terpilih pada Indikator ${indIdx + 1}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* List of Chosen Students for this Indicator */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {chosenStudents.map((st, sIdx) => {
                        const item = studentGrades[st.id] || {
                          scores: indicators.map(() => 3),
                          feedback: feedbackPresets[1],
                          notes: 'Tuntas',
                        };
                        const currentScore = item.scores[indIdx] || 3;
                        const finalScore = calculateFinalScore(item.scores, st.id);
                        const isPresent = presentStudentIds.has(st.id);

                        return (
                          <div
                            key={st.id}
                            className="p-2.5 sm:p-3.5 flex flex-row items-center justify-between gap-2 sm:gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* Murid Name (NO NIS) - Sejajar dengan tombol di mode handphone */}
                            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                              <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 w-4 sm:w-6 text-center tabular-nums shrink-0">
                                {sIdx + 1}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {st.name}
                                  </span>
                                  {isPresent && (
                                    <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                      Hadir
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>
                                    Skor: <strong className="text-slate-800 dark:text-slate-200 font-bold">{currentScore}</strong>
                                  </span>
                                  <span>·</span>
                                  <span>
                                    Nilai: <strong className="text-blue-600 dark:text-blue-400 font-bold">{finalScore}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* PISAHKAN ANGKANYA: SEPARATED DISTINCT BUTTONS [ 1 ] [ 2 ] [ 3 ] [ 4 ] - SEJAJAR DI MODE HANDPHONE */}
                            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
                              {[1, 2, 3, 4].map((num) => {
                                const isActive = currentScore === num;

                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleScoreChange(st.id, indIdx, num)}
                                    title={`Skor ${num}: ${getScoreLabel(num)}`}
                                    className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold font-mono transition-all flex items-center justify-center border cursor-pointer active:scale-95 shadow-2xs ${
                                      isActive
                                        ? getActiveButtonClass(num)
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <span>{num}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE 2: PER MURID (KARTU SISWA INDIVIDUAL) */}
            {viewMode === 'by-student' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {chosenStudents.map((st, sIdx) => {
                  const item = studentGrades[st.id] || {
                    scores: indicators.map(() => 3),
                    feedback: feedbackPresets[1],
                    notes: 'Tuntas',
                  };
                  const finalScore = calculateFinalScore(item.scores, st.id);
                  const isPresent = presentStudentIds.has(st.id);

                  return (
                    <div
                      key={st.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between"
                    >
                      {/* Student Card Header (NO NIS) */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                            {sIdx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {st.name}
                              </span>
                              {isPresent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  Hadir
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Final Score Badge */}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nilai Akhir</span>
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-md border ${
                              finalScore >= 80
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                                : finalScore >= 70
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200'
                                : finalScore >= 60
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200'
                            }`}
                          >
                            {finalScore} / 100
                          </span>
                        </div>
                      </div>

                      {/* Indicators rows for this student */}
                      <div className="p-3.5 space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                        {indicators.map((ind, i) => {
                          const currentScore = item.scores[i] || 3;

                          return (
                            <div
                              key={i}
                              className="pt-2.5 first:pt-0 flex flex-row items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1 pr-1.5">
                                <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                  Indikator {i + 1}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                  {ind.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Skor: {currentScore} ({getScoreLabel(currentScore)})
                                </span>
                              </div>

                              {/* Separated 1-4 buttons - Sejajar di mode handphone */}
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {[1, 2, 3, 4].map((num) => {
                                  const isActive = currentScore === num;

                                  return (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => handleScoreChange(st.id, i, num)}
                                      title={`Skor ${num}: ${getScoreLabel(num)}`}
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center justify-center border cursor-pointer active:scale-95 shadow-2xs ${
                                        isActive
                                          ? getActiveButtonClass(num)
                                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Feedback Input */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Umpan Balik Guru:
                          </label>
                        </div>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={item.feedback}
                            onChange={(e) => handleFeedbackChange(st.id, e.target.value)}
                            placeholder="Catatan unjuk kerja murid..."
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex flex-wrap gap-1">
                            {feedbackPresets.slice(0, 3).map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleFeedbackChange(st.id, preset)}
                                className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[200px] cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 3: TABEL RINGKAS (NO NIS COLUMN) */}
            {viewMode === 'table' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        {/* STRICTLY NO NIS PER REQUEST */}
                        <th className="py-2.5 px-3 min-w-[180px]">Nama Murid</th>
                        {indicators.map((ind, i) => (
                          <th key={i} className="py-2.5 px-3 text-center min-w-[150px]">
                            <div className="font-bold text-slate-700 dark:text-slate-200">Indikator {i + 1}</div>
                            <div className="text-[10px] font-normal text-slate-400 truncate max-w-[140px] mx-auto">
                              {ind.name}
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center w-24">Nilai Akhir</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Umpan Balik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {chosenStudents.map((st, idx) => {
                        const item = studentGrades[st.id] || {
                          scores: indicators.map(() => 3),
                          feedback: feedbackPresets[1],
                          notes: 'Tuntas',
                        };
                        const final = calculateFinalScore(item.scores, st.id);
                        const isPresent = presentStudentIds.has(st.id);

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 tabular-nums">
                              {idx + 1}
                            </td>
                            {/* NO NIS */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {st.name}
                                </span>
                                {isPresent && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                    Hadir
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Indicators separated buttons */}
                            {indicators.map((_, i) => {
                              const currentScore = item.scores[i] || 3;
                              return (
                                <td key={i} className="py-2.5 px-2 text-center">
                                  <div className="inline-flex items-center justify-center gap-1.5">
                                    {[1, 2, 3, 4].map((num) => {
                                      const isActive = currentScore === num;
                                      return (
                                        <button
                                          key={num}
                                          type="button"
                                          onClick={() => handleScoreChange(st.id, i, num)}
                                          title={`Skor ${num}: ${getScoreLabel(num)}`}
                                          className={`w-7 h-7 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
                                            isActive
                                              ? getActiveButtonClass(num)
                                              : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                          }`}
                                        >
                                          {num}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}

                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md border tabular-nums ${
                                  final >= 80
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                                    : final >= 70
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200'
                                    : final >= 60
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200'
                                }`}
                              >
                                {final}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.feedback}
                                onChange={(e) => handleFeedbackChange(st.id, e.target.value)}
                                placeholder="Umpan balik..."
                                className="w-full text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Total {chosenStudents.length} murid dinilai
                </span>
                <span>·</span>
                <span>Nilai 1–4 otomatis dikonversi ke skala 0–100</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Nilai Keterampilan'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
