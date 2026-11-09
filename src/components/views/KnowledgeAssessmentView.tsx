import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  Users,
  Search,
  Calculator,
  Plus,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  X,
  FileText,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Student,
  ClassItem,
  KnowledgeAssessment,
  AppSettings,
} from '../../types';
import { normalizeClassKey } from '../../services/storage';

interface KnowledgeAssessmentViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  existingAssessments: KnowledgeAssessment[];
  onSaveAssessmentBatch: (records: KnowledgeAssessment[]) => Promise<void>;
  onDeleteAssessment: (id: string) => Promise<void>;
  onBatchDeleteAssessments?: (ids: string[]) => Promise<void>;
  onNavigateToDashboard?: () => void;
}

interface UploadPreviewItem {
  nis: string;
  name: string;
  score: number;
  notes: string;
  matchedStudent?: Student;
  status: 'matched' | 'not_found' | 'invalid_score';
  message: string;
}

export const KnowledgeAssessmentView: React.FC<KnowledgeAssessmentViewProps> = ({
  students,
  classes,
  settings,
  existingAssessments,
  onSaveAssessmentBatch,
  onDeleteAssessment,
  onBatchDeleteAssessments,
  onNavigateToDashboard,
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
  const [subject, setSubject] = useState<string>(settings.subject || 'PJOK');
  const [topic, setTopic] = useState<string>('Aturan & Taktik Permainan Bola Besar');
  const [assessmentType, setAssessmentType] = useState<KnowledgeAssessment['assessmentType']>('Formatif');
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

  // Student scores local edit state: { [studentId]: { score: number, notes: string } }
  const [scoresMap, setScoresMap] = useState<Record<string, { score: number; notes: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Selected class item
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  // Active students for selected class with name and normalized key fallback
  const classStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (!s.isActive) return false;
        if (s.classId === selectedClassId) return true;
        if (currentClass) {
          if (s.classId.toLowerCase() === currentClass.name.toLowerCase()) return true;
          return (
            normalizeClassKey(s.classId) === normalizeClassKey(currentClass.name) ||
            normalizeClassKey(s.classId) === normalizeClassKey(currentClass.id)
          );
        }
        return false;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
  }, [students, selectedClassId, currentClass]);

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

  // --- DOWNLOAD FORMAT TEMPLATE ---
  const handleDownloadTemplate = (formatType: 'filled' | 'blank' = 'filled') => {
    setShowTemplateDropdown(false);
    const className = currentClass ? currentClass.name : 'Kelas';
    const cleanTopic = (topic || 'Pengetahuan').replace(/[/\\?%*:|"<>]/g, '_');

    // Build worksheet data
    const headers = ['No', 'NIS', 'Nama Siswa', 'Nilai (0-100)', 'Catatan / Keterangan'];
    const rows: (string | number)[][] = [headers];

    if (formatType === 'filled' && classStudents.length > 0) {
      classStudents.forEach((st, idx) => {
        const currentItem = scoresMap[st.id];
        rows.push([
          idx + 1,
          st.nis,
          st.name,
          currentItem?.score !== undefined ? currentItem.score : '',
          currentItem?.notes || '',
        ]);
      });
    } else {
      // Sample/Blank template rows
      for (let i = 1; i <= 5; i++) {
        rows.push([i, `1000${i}`, `Contoh Nama Siswa ${i}`, 85, 'Tuntas']);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 16 }, // NIS
      { wch: 32 }, // Nama Siswa
      { wch: 16 }, // Nilai
      { wch: 30 }, // Catatan
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format Nilai');

    const fileName = `Format_Nilai_${className}_${cleanTopic}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // --- UPLOAD EXCEL / CSV NILAI ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) {
          throw new Error('Gagal membaca berkas.');
        }

        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('File tidak memiliki lembar kerja (sheet).');
        }

        const ws = wb.Sheets[firstSheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawData || rawData.length === 0) {
          throw new Error('File kosong atau format tidak sesuai.');
        }

        // Find header row index
        let headerRowIdx = -1;
        let colNis = -1;
        let colName = -1;
        let colScore = -1;
        let colNotes = -1;

        for (let r = 0; r < Math.min(10, rawData.length); r++) {
          const row = rawData[r] || [];
          const lowerRow = row.map((c) => String(c || '').toLowerCase().trim());

          const idxNis = lowerRow.findIndex((c) => c === 'nis' || c.includes('nomor induk') || c === 'nisn');
          const idxName = lowerRow.findIndex((c) => c.includes('nama') || c.includes('siswa') || c.includes('murid'));
          const idxScore = lowerRow.findIndex((c) => c.includes('nilai') || c.includes('skor') || c === 'score');
          const idxNotes = lowerRow.findIndex((c) => c.includes('catatan') || c.includes('keterangan') || c.includes('notes'));

          if (idxScore !== -1 && (idxName !== -1 || idxNis !== -1)) {
            headerRowIdx = r;
            colNis = idxNis;
            colName = idxName;
            colScore = idxScore;
            colNotes = idxNotes;
            break;
          }
        }

        // If not explicitly detected by keywords, fallback to standard column index 0=No, 1=NIS, 2=Nama, 3=Nilai, 4=Catatan
        if (headerRowIdx === -1) {
          headerRowIdx = 0;
          colNis = 1;
          colName = 2;
          colScore = 3;
          colNotes = 4;
        }

        const previewItems: UploadPreviewItem[] = [];

        for (let r = headerRowIdx + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0) continue;

          const rawNis = colNis !== -1 && row[colNis] !== undefined ? String(row[colNis]).trim() : '';
          const rawName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : '';
          const rawScoreVal = colScore !== -1 ? row[colScore] : '';
          const rawNotes = colNotes !== -1 && row[colNotes] !== undefined ? String(row[colNotes]).trim() : '';

          if (!rawNis && !rawName) continue; // Skip empty row

          const parsedScore = parseFloat(String(rawScoreVal).replace(',', '.'));
          const isScoreValid = !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100;

          // Attempt student matching in classStudents
          let matched: Student | undefined;

          if (rawNis) {
            matched = classStudents.find(
              (s) => s.nis.trim() === rawNis || (s.nisn && s.nisn.trim() === rawNis)
            );
          }

          if (!matched && rawName) {
            const cleanRawName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
            matched = classStudents.find((s) => {
              const cleanSName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanSName === cleanRawName || cleanSName.includes(cleanRawName) || cleanRawName.includes(cleanSName);
            });
          }

          let status: UploadPreviewItem['status'] = 'matched';
          let message = 'Siap diimpor';

          if (!matched) {
            status = 'not_found';
            message = 'Siswa tidak ditemukan pada kelas ini';
          } else if (!isScoreValid) {
            status = 'invalid_score';
            message = 'Nilai tidak valid (harus 0-100)';
          }

          previewItems.push({
            nis: rawNis,
            name: rawName,
            score: isScoreValid ? parsedScore : 0,
            notes: rawNotes,
            matchedStudent: matched,
            status,
            message,
          });
        }

        if (previewItems.length === 0) {
          throw new Error('Tidak ada baris data nilai murid yang ditemukan dalam berkas.');
        }

        setUploadPreview(previewItems);
        setShowUploadModal(true);
      } catch (err: any) {
        setUploadError(err.message || 'Gagal memproses file Excel/CSV.');
      }
    };

    reader.onerror = () => {
      setUploadError('Gagal membaca berkas.');
    };

    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Apply previewed scores to state
  const handleApplyUpload = () => {
    let appliedCount = 0;
    setScoresMap((prev) => {
      const next = { ...prev };
      uploadPreview.forEach((item) => {
        if (item.matchedStudent && item.status === 'matched') {
          next[item.matchedStudent.id] = {
            score: item.score,
            notes: item.notes || next[item.matchedStudent.id]?.notes || '',
          };
          appliedCount++;
        }
      });
      return next;
    });

    setShowUploadModal(false);
    setSaveSuccessMsg(
      `Berhasil mengimpor ${appliedCount} nilai dari berkas "${uploadFileName}". Jangan lupa klik "Simpan Nilai" untuk menyimpan perubahan!`
    );
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
      setSaveSuccessMsg(`Nilai pengetahuan "${topic}" (${assessmentType}) berhasil disimpan! Mengalihkan ke menu dashboard...`);
      if (onNavigateToDashboard) {
        setTimeout(() => {
          onNavigateToDashboard();
        }, 1200);
      }
    } catch (e: any) {
      alert('Gagal menyimpan nilai: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const matchedUploadCount = uploadPreview.filter((i) => i.status === 'matched').length;

  return (
    <div className="space-y-5">
      {/* Hidden file input for uploading */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Penilaian Pengetahuan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola nilai formatif, sumatif, tugas, dan ulangan. Tersedia format template unduhan dan fitur unggah nilai langsung dari file Excel/CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Format & Upload Dropdown/Buttons */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateDropdown((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Format Template</span>
            </button>

            {showTemplateDropdown && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 z-20 text-xs"
                onMouseLeave={() => setShowTemplateDropdown(false)}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Unduh Format File
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('filled')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold">Format Kelas {currentClass?.name || ''}</div>
                      <div className="text-[10px] text-slate-500">Berisi {classStudents.length} nama murid kelas ini</div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('blank')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold">Format Kosong / Contoh</div>
                      <div className="text-[10px] text-slate-500">Template standar kolom Excel</div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Nilai Excel/CSV</span>
          </button>

          <button
            type="button"
            disabled={isSaving || classStudents.length === 0}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              Statistik Nilai Kelas {currentClass?.name}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              Daftar Input Nilai Murid
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              ({classStudents.length} murid terdaftar)
            </span>
          </div>

          <div className="flex items-center gap-2">
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
                  <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
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

      {/* --- PREVIEW MODAL FOR UPLOADED FILE --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Konfirmasi Upload Nilai Pengetahuan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Berkas: <span className="font-medium text-slate-700 dark:text-slate-300">{uploadFileName}</span> · Kelas: {currentClass?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Summary Cards */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Total Baris File</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {uploadPreview.length}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">Siswa Cocok</span>
                  <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                    {matchedUploadCount} <span className="text-xs font-normal">dari {classStudents.length} murid</span>
                  </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block">Rata-rata Nilai Diimpor</span>
                  <span className="text-lg font-bold text-blue-800 dark:text-blue-300 font-mono">
                    {matchedUploadCount > 0
                      ? Math.round(
                          (uploadPreview
                            .filter((i) => i.status === 'matched')
                            .reduce((sum, i) => sum + i.score, 0) /
                            matchedUploadCount) *
                            10
                        ) / 10
                      : 0}
                  </span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 sticky top-0 uppercase">
                      <tr>
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">NIS</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-3 text-center">Nilai Baru</th>
                        <th className="py-2 px-3">Catatan</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {uploadPreview.map((item, idx) => {
                        const isOk = item.status === 'matched';
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isOk ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono">{item.nis || '-'}</td>
                            <td className="py-2 px-3 font-medium">
                              <div>{item.name || item.matchedStudent?.name}</div>
                              {item.matchedStudent && item.matchedStudent.name !== item.name && (
                                <div className="text-[10px] text-emerald-600">
                                  Cocok dengan: {item.matchedStudent.name}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold">
                              {isOk ? (
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-bold">
                                  {item.score}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {item.notes || '-'}
                            </td>
                            <td className="py-2 px-3">
                              {isOk ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                  Cocok
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                  {item.message}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                💡 <span className="font-semibold text-slate-700 dark:text-slate-300">Petunjuk:</span> Nilai yang cocok akan otomatis mengisi tabel input. Anda masih bisa meninjau dan mengedit sebelum menekan tombol <strong>Simpan Nilai</strong>.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={matchedUploadCount === 0}
                onClick={handleApplyUpload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Nilai ({matchedUploadCount} Murid)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
