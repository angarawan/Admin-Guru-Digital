import React, { useState, useRef } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Printer,
  ShieldAlert,
  Calendar,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Camera,
  MapPin,
  ExternalLink,
  Upload,
  Loader2,
  Check,
} from 'lucide-react';
import {
  MentoringJournal,
  Student,
  ClassItem,
  AppSettings,
  MentoringStatus,
} from '../../types';
import { Modal } from '../ui/Modal';
import { SignaturePad } from '../ui/SignaturePad';

interface MentoringJournalViewProps {
  journals: MentoringJournal[];
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  onSaveJournal: (journal: MentoringJournal) => Promise<void>;
  onDeleteJournal: (id: string) => Promise<void>;
  onBatchDeleteJournals?: (ids: string[]) => Promise<void>;
  onResetDefaultJournals?: () => void;
  onNavigateToDashboard?: () => void;
}

export const MentoringJournalView: React.FC<MentoringJournalViewProps> = ({
  journals,
  students,
  classes,
  settings,
  onSaveJournal,
  onDeleteJournal,
  onBatchDeleteJournals,
  onResetDefaultJournals,
  onNavigateToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [editingJournal, setEditingJournal] = useState<MentoringJournal | null>(null);
  const [activeJournal, setActiveJournal] = useState<MentoringJournal | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MentoringJournal>>({
    journalNumber: `JPM/${new Date().getFullYear()}/${String(journals.length + 1).padStart(3, '0')}`,
    date: todayStr,
    studentId: students[0]?.id || '',
    studentName: students[0]?.name || '',
    classId: students[0]?.classId || '',
    problemType: 'Kendala Belajar',
    problemDescription: '',
    identificationResult: '',
    mentoringSteps: '',
    mutualAgreement: '',
    followUp: '',
    status: 'Dalam Pendampingan',
    nextEvaluationDate: '',
    mentorTeacher: settings.teacherName,
    teacherSignature: '',
    studentSignature: '',
    documentationPhoto: '',
    gpsCoordinates: undefined,
  });

  const handleStudentSelect = (studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    if (st) {
      setFormData((prev) => ({
        ...prev,
        studentId: st.id,
        studentName: st.name,
        classId: st.classId,
      }));
    }
  };

  // Acquire high accuracy GPS location
  const getGpsLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsErrorMsg('Perangkat tidak mendukung geolokasi GPS.');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsErrorMsg(null);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('GPS location request notice:', err.message);
          setGpsErrorMsg('Izin GPS tidak diberikan atau sinyal lemah. Foto tetap diproses dengan penanda waktu.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  // Process and stamp documentation photo with GPS watermark
  const handleCaptureImage = async (file: File) => {
    if (!file) return;
    setIsProcessingPhoto(true);
    setGpsErrorMsg(null);

    try {
      const gps = await getGpsLocation();

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsProcessingPhoto(false);
            return;
          }

          // Render captured photo
          ctx.drawImage(img, 0, 0, w, h);

          // Render sleek bottom banner for authentic GPS watermark
          const bannerHeight = Math.max(74, Math.round(h * 0.16));
          const gradient = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
          gradient.addColorStop(0, 'rgba(15, 23, 42, 0.78)');
          gradient.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

          // Accent top border
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, h - bannerHeight);
          ctx.lineTo(w, h - bannerHeight);
          ctx.stroke();

          // Text metrics
          const baseSize = Math.max(12, Math.round(w * 0.024));
          ctx.font = `bold ${baseSize}px sans-serif`;
          ctx.fillStyle = '#38bdf8';
          const title = gps ? '📍 DOKUMENTASI TERVERIFIKASI GPS' : '📷 DOKUMENTASI PENDAMPINGAN';
          ctx.fillText(title, 16, h - bannerHeight + baseSize + 6);

          ctx.font = `normal ${Math.max(10, Math.round(baseSize * 0.85))}px monospace`;
          ctx.fillStyle = '#f8fafc';
          const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
          const gpsText = gps
            ? `GPS: ${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)} (±${Math.round(gps.accuracy)}m)`
            : 'GPS: Lokasi Manual (Izin Dinonaktifkan)';
          ctx.fillText(`${nowStr} · ${gpsText}`, 16, h - bannerHeight + baseSize * 2 + 10);

          ctx.font = `normal ${Math.max(10, Math.round(baseSize * 0.82))}px sans-serif`;
          ctx.fillStyle = '#cbd5e1';
          const selectedStudent = students.find((s) => s.id === formData.studentId);
          const studentDisplayName = selectedStudent?.name || formData.studentName || 'Siswa';
          const teacherDisplayName = formData.mentorTeacher || settings.teacherName;
          ctx.fillText(`Guru: ${teacherDisplayName} | Murid: ${studentDisplayName}`, 16, h - bannerHeight + baseSize * 3 + 14);

          const stampedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          setFormData((prev) => ({
            ...prev,
            documentationPhoto: stampedBase64,
            gpsCoordinates: gps
              ? {
                  latitude: gps.latitude,
                  longitude: gps.longitude,
                  accuracy: gps.accuracy,
                  timestamp: new Date().toISOString(),
                }
              : undefined,
          }));
          setIsProcessingPhoto(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing photo:', err);
      setIsProcessingPhoto(false);
    }
  };

  React.useEffect(() => {
    if (journals.length === 0 && onResetDefaultJournals) {
      onResetDefaultJournals();
    }
  }, [journals.length, onResetDefaultJournals]);

  const openAddModal = () => {
    setEditingJournal(null);
    const firstStudent = students[0];
    setGpsErrorMsg(null);
    setFormData({
      journalNumber: `JPM/${new Date().getFullYear()}/${String(journals.length + 1).padStart(3, '0')}`,
      date: todayStr,
      studentId: firstStudent?.id || '',
      studentName: firstStudent?.name || '',
      classId: firstStudent?.classId || '',
      problemType: 'Kendala Belajar',
      problemDescription: '',
      identificationResult: '',
      mentoringSteps: '',
      mutualAgreement: '',
      followUp: '',
      status: 'Dalam Pendampingan',
      nextEvaluationDate: '',
      mentorTeacher: settings.teacherName,
      teacherSignature: '',
      studentSignature: '',
      documentationPhoto: '',
      gpsCoordinates: undefined,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (journal: MentoringJournal) => {
    setEditingJournal(journal);
    setGpsErrorMsg(null);
    setFormData({ ...journal });
    setIsModalOpen(true);
  };

  const openDetailModal = (journal: MentoringJournal) => {
    setActiveJournal(journal);
    setIsDetailModalOpen(true);
  };

  const openPrintModal = (journal: MentoringJournal) => {
    setActiveJournal(journal);
    setIsPrintModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.problemDescription) {
      alert('Mohon pilih murid dan lengkapi uraian permasalahan.');
      return;
    }

    const item: MentoringJournal = {
      id: editingJournal ? editingJournal.id : `mnt-${Date.now()}`,
      journalNumber: formData.journalNumber || `JPM/${new Date().getFullYear()}/001`,
      date: formData.date || todayStr,
      studentId: formData.studentId || '',
      studentName: formData.studentName || '',
      classId: formData.classId || '',
      problemType: formData.problemType || 'Kendala Belajar',
      problemDescription: formData.problemDescription || '',
      identificationResult: formData.identificationResult || '',
      mentoringSteps: formData.mentoringSteps || '',
      mutualAgreement: formData.mutualAgreement || '',
      followUp: formData.followUp || '',
      status: (formData.status as MentoringStatus) || 'Dalam Pendampingan',
      nextEvaluationDate: formData.nextEvaluationDate || '',
      mentorTeacher: formData.mentorTeacher || settings.teacherName,
      teacherSignature: formData.teacherSignature || '',
      studentSignature: formData.studentSignature || '',
      documentationPhoto: formData.documentationPhoto || '',
      gpsCoordinates: formData.gpsCoordinates,
    };

    await onSaveJournal(item);
    setIsModalOpen(false);

    if (onNavigateToDashboard) {
      setTimeout(() => {
        onNavigateToDashboard();
      }, 500);
    }
  };

  const handleDelete = async (journal: MentoringJournal) => {
    if (confirm(`Hapus jurnal pendampingan nomor ${journal.journalNumber} untuk ${journal.studentName}?`)) {
      await onDeleteJournal(journal.id);
      setSelectedIds((prev) => prev.filter((id) => id !== journal.id));
    }
  };

  const filteredJournals = journals.filter((j) => {
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    const matchSearch =
      j.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.problemType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const isAllSelected = filteredJournals.length > 0 && filteredJournals.every((j) => selectedIds.includes(j.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredJournals.map((j) => j.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (confirm(`Apakah Anda yakin ingin menghapus ${count} jurnal pendampingan yang dicentang?`)) {
      if (onBatchDeleteJournals) {
        await onBatchDeleteJournals(selectedIds);
      } else {
        for (const id of selectedIds) {
          await onDeleteJournal(id);
        }
      }
      setSelectedIds([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Jurnal Pendampingan Murid
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencatatan konseling akademik & kedisiplinan murid lengkap dengan tanda tangan digital guru dan siswa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onResetDefaultJournals && (
            <button
              type="button"
              onClick={onResetDefaultJournals}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors"
              title="Muat kembali data contoh pendampingan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Muat Data Contoh
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Catat Pendampingan Baru
          </button>
        </div>
      </div>

      {/* Confidentiality Warning Banner (Mandatory per section 10) */}
      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-bold">Dokumen Rahasia & Terbatas:</span> Data pendampingan memuat informasi pribadi murid dan keluarga.
          Hanya untuk dipergunakan oleh guru pendamping, wali kelas, dan guru bimbingan konseling.
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              title="Centang untuk memilih/menghapus semua jurnal pendampingan"
            />
            <span>Centang Semua</span>
          </label>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">Semua Status ({journals.length})</option>
              <option value="Dalam Pendampingan">Dalam Pendampingan</option>
              <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari murid, nomor jurnal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {selectedIds.length} jurnal pendampingan dicentang
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              dari total {filteredJournals.length} jurnal
            </span>
            <span className="text-slate-400">·</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
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
              {isAllSelected ? 'Hapus Centang Semua' : `Centang Semua (${filteredJournals.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedIds.length === filteredJournals.length ? 'Semua Jurnal' : `${selectedIds.length} Jurnal Terpilih`}
            </button>
          </div>
        </div>
      )}

      {/* Mentoring Records Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJournals.length > 0 ? (
          filteredJournals.map((jr) => {
            const cls = classes.find((c) => c.id === jr.classId);
            const isSelected = selectedIds.includes(jr.id);
            const statusColors = {
              'Dalam Pendampingan': 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
              'Perlu Tindak Lanjut': 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
              'Selesai': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            }[jr.status];

            return (
              <div
                key={jr.id}
                className={`rounded-xl border transition-all p-4 space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(jr.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title="Centang jurnal pendampingan ini"
                      />
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {jr.journalNumber}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusColors}`}>
                      {jr.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{jr.studentName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kelas: <span className="font-semibold text-slate-700 dark:text-slate-300">{cls?.name || jr.classId}</span> · Tanggal: {jr.date}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Jenis: <span className="text-blue-700 dark:text-blue-400">{jr.problemType}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{jr.problemDescription}</p>
                  </div>

                  {jr.mutualAgreement && (
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Kesepakatan:</span>{' '}
                      <span className="italic">{jr.mutualAgreement}</span>
                    </div>
                  )}

                  {/* Signature presence preview */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      {jr.teacherSignature ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      TTD Guru
                    </span>
                    <span className="flex items-center gap-1">
                      {jr.studentSignature ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      TTD Siswa
                    </span>
                    {jr.documentationPhoto && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        Foto GPS
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Guru: {jr.mentorTeacher}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openPrintModal(jr)}
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                      title="Cetak Dokumen PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetailModal(jr)}
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(jr)}
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(jr)}
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada jurnal pendampingan murid yang tercatat.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Anda dapat membuat catatan pendampingan baru atau memuat data contoh untuk simulasi.</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Buat Jurnal Baru
              </button>
              {onResetDefaultJournals && (
                <button
                  type="button"
                  onClick={onResetDefaultJournals}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Muat Contoh Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Mentoring Journal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJournal ? 'Edit Jurnal Pendampingan' : 'Catat Jurnal Pendampingan Murid'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Jurnal
              </label>
              <input
                type="text"
                value={formData.journalNumber || ''}
                onChange={(e) => setFormData({ ...formData, journalNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pendampingan
              </label>
              <input
                type="date"
                required
                value={formData.date || todayStr}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Pendampingan
              </label>
              <select
                value={formData.status || 'Dalam Pendampingan'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MentoringStatus })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="Dalam Pendampingan">Dalam Pendampingan</option>
                <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Nama Murid *
              </label>
              <select
                value={formData.studentId || ''}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {students.map((st) => {
                  const cls = classes.find((c) => c.id === st.classId);
                  return (
                    <option key={st.id} value={st.id}>
                      {st.name} ({cls?.name || st.classId} - NIS: {st.nis})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kelas Otomatis
              </label>
              <input
                type="text"
                readOnly
                value={classes.find((c) => c.id === formData.classId)?.name || formData.classId || ''}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jenis Permasalahan
            </label>
            <select
              value={formData.problemType || 'Kendala Belajar'}
              onChange={(e) => setFormData({ ...formData, problemType: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="Kendala Belajar">Kendala Belajar / Akademik</option>
              <option value="Kedisiplinan">Kedisiplinan & Tata Tertib</option>
              <option value="Kehadiran">Kehadiran / Kerap Membolos</option>
              <option value="Sosial/Emosional">Sosial, Emosional, & Teman Sebaya</option>
              <option value="Motivasi">Motivasi & Minat Belajar Rendah</option>
              <option value="Lainnya">Permasalahan Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Uraian Permasalahan *
            </label>
            <textarea
              rows={2}
              required
              value={formData.problemDescription || ''}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="Deskripsikan latar belakang dan fakta kejadian yang dialami murid..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hasil Identifikasi Masalah
              </label>
              <textarea
                rows={2}
                value={formData.identificationResult || ''}
                onChange={(e) => setFormData({ ...formData, identificationResult: e.target.value })}
                placeholder="Akar penyebab (faktor keluarga, lingkungan, kesehatan, dll)..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Langkah Pendampingan yang Dilakukan
              </label>
              <textarea
                rows={2}
                value={formData.mentoringSteps || ''}
                onChange={(e) => setFormData({ ...formData, mentoringSteps: e.target.value })}
                placeholder="Konseling individu, diskusi solusi, motivasi..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kesepakatan Bersama
              </label>
              <textarea
                rows={2}
                value={formData.mutualAgreement || ''}
                onChange={(e) => setFormData({ ...formData, mutualAgreement: e.target.value })}
                placeholder="Komitmen yang disetujui murid dan guru..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tindak Lanjut & Rencana Evaluasi
              </label>
              <textarea
                rows={2}
                value={formData.followUp || ''}
                onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                placeholder="Pemantauan berkala, koordinasi wali kelas/BK/orang tua..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Evaluasi Berikutnya
              </label>
              <input
                type="date"
                value={formData.nextEvaluationDate || ''}
                onChange={(e) => setFormData({ ...formData, nextEvaluationDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Guru Pendamping
              </label>
              <input
                type="text"
                value={formData.mentorTeacher || settings.teacherName}
                onChange={(e) => setFormData({ ...formData, mentorTeacher: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Digital Signature Pads (Mandatory Feature per section 10) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Tanda Tangan Digital Dokumen Pendampingan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SignaturePad
                label="Tanda Tangan Guru Pendamping:"
                value={formData.teacherSignature}
                onChange={(val) => setFormData({ ...formData, teacherSignature: val })}
              />

              <SignaturePad
                label="Tanda Tangan Murid Bersangkutan:"
                value={formData.studentSignature}
                onChange={(val) => setFormData({ ...formData, studentSignature: val })}
              />
            </div>
          </div>

          {/* Dokumentasi Foto Langsung & GPS Geolocation */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Dokumentasi Foto & Validasi Lokasi GPS
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ambil foto langsung kamera HP/laptop atau unggah berkas. Koordinat GPS, tanggal-waktu, dan identitas akan distempel otomatis pada foto.
                </p>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCaptureImage(file);
                e.target.value = '';
              }}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCaptureImage(file);
                e.target.value = '';
              }}
            />

            {gpsErrorMsg && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gpsErrorMsg}</span>
              </div>
            )}

            {isProcessingPhoto ? (
              <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 flex items-center justify-center gap-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>Mendeteksi koordinat GPS presisi dan memproses stempel foto...</span>
              </div>
            ) : formData.documentationPhoto ? (
              <div className="space-y-2">
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-900 group">
                  <img
                    src={formData.documentationPhoto}
                    alt="Dokumentasi Pendampingan"
                    className="w-full max-h-72 object-contain bg-slate-950/80 mx-auto"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, documentationPhoto: '', gpsCoordinates: undefined }))}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white shadow-md text-xs font-semibold flex items-center gap-1"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  </div>
                </div>

                {formData.gpsCoordinates && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <MapPin className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono font-medium">
                        GPS: {formData.gpsCoordinates.latitude.toFixed(6)}, {formData.gpsCoordinates.longitude.toFixed(6)} (±{Math.round(formData.gpsCoordinates.accuracy || 0)}m)
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${formData.gpsCoordinates.latitude},${formData.gpsCoordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Foto Ulang (Kamera)
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    Ganti dari Berkas
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Ambil Foto Langsung (Kamera)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Buka kamera ponsel/laptop + GPS otomatis
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Unggah dari Galeri / Berkas
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Pilih foto dokumentasi yang sudah tersimpan
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              Simpan Dokumen Pendampingan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Jurnal Pendampingan Murid"
        maxWidth="2xl"
      >
        {activeJournal && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{activeJournal.studentName}</span>
                <p className="text-slate-500 dark:text-slate-400">
                  {activeJournal.journalNumber} · Tanggal: {activeJournal.date}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {activeJournal.status}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Jenis Permasalahan:</span>
                <span className="text-slate-700 dark:text-slate-300">{activeJournal.problemType}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Uraian Permasalahan:</span>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{activeJournal.problemDescription}</p>
              </div>
              {activeJournal.identificationResult && (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Hasil Identifikasi:</span>
                  <p className="text-slate-700 dark:text-slate-300">{activeJournal.identificationResult}</p>
                </div>
              )}
              {activeJournal.mutualAgreement && (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Kesepakatan Bersama:</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">{activeJournal.mutualAgreement}</p>
                </div>
              )}
              {activeJournal.followUp && (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Tindak Lanjut:</span>
                  <p className="text-slate-700 dark:text-slate-300">{activeJournal.followUp}</p>
                </div>
              )}
            </div>

            {/* Display Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] mb-2">
                  Tanda Tangan Guru
                </span>
                {activeJournal.teacherSignature ? (
                  <img
                    src={activeJournal.teacherSignature}
                    alt="TTD Guru"
                    className="h-16 mx-auto object-contain bg-white rounded p-1 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                    Belum ditandatangani
                  </div>
                )}
                <span className="font-medium text-slate-800 dark:text-slate-200 block mt-2 text-xs">
                  {activeJournal.mentorTeacher}
                </span>
              </div>

              <div className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] mb-2">
                  Tanda Tangan Siswa
                </span>
                {activeJournal.studentSignature ? (
                  <img
                    src={activeJournal.studentSignature}
                    alt="TTD Siswa"
                    className="h-16 mx-auto object-contain bg-white rounded p-1 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                    Belum ditandatangani
                  </div>
                )}
                <span className="font-medium text-slate-800 dark:text-slate-200 block mt-2 text-xs">
                  {activeJournal.studentName}
                </span>
              </div>
            </div>

            {/* Display Documentation Photo with GPS */}
            {activeJournal.documentationPhoto && (
              <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Foto Dokumentasi & Verifikasi Lokasi GPS:
                </span>
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                  <img
                    src={activeJournal.documentationPhoto}
                    alt="Foto Pendampingan"
                    className="w-full max-h-80 object-contain mx-auto"
                  />
                </div>
                {activeJournal.gpsCoordinates && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                    <span className="font-mono text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      GPS: {activeJournal.gpsCoordinates.latitude.toFixed(6)}, {activeJournal.gpsCoordinates.longitude.toFixed(6)} (±{Math.round(activeJournal.gpsCoordinates.accuracy || 0)}m)
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${activeJournal.gpsCoordinates.latitude},${activeJournal.gpsCoordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-300 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Buka di Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openPrintModal(activeJournal);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Lembar Dokumen
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Print Printable Sheet */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Lembar Jurnal Pendampingan"
        maxWidth="2xl"
      >
        {activeJournal && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 border-b border-slate-100 pb-3 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Cetak ke PDF / Printer Sekarang
              </button>
            </div>

            {/* Official Printable Document Format */}
            <div className="printable-area border border-slate-300 p-8 rounded-lg bg-white space-y-5 text-slate-900 font-serif">
              {/* Kop Surat Sekolah */}
              <div className="flex items-center justify-center gap-4 border-b-2 border-slate-900 pb-4">
                {settings.schoolLogo && (
                  <img
                    src={settings.schoolLogo}
                    alt="Logo Sekolah"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                  />
                )}
                <div className="text-center flex-1">
                  <h3 className="text-sm font-bold tracking-wider uppercase text-slate-900 font-sans">
                    {settings.schoolName || 'SMA NEGERI CONTOH'}
                  </h3>
                  <h2 className="text-base font-extrabold uppercase font-sans mt-0.5">
                    LEMBAR JURNAL PENDAMPINGAN SISWA
                  </h2>
                  <p className="text-xs font-sans text-slate-600">
                    Tahun Ajaran {settings.academicYear} · Semester {settings.semester}
                  </p>
                  <p className="text-[11px] font-sans font-mono text-slate-500 mt-1">
                    Nomor Arsip: {activeJournal.journalNumber}
                  </p>
                </div>
              </div>

              {/* Data Siswa */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="font-bold">Nama Siswa:</span> {activeJournal.studentName}
                </div>
                <div>
                  <span className="font-bold">Kelas:</span>{' '}
                  {classes.find((c) => c.id === activeJournal.classId)?.name || activeJournal.classId}
                </div>
                <div>
                  <span className="font-bold">Tanggal Pendampingan:</span> {activeJournal.date}
                </div>
                <div>
                  <span className="font-bold">Status:</span> {activeJournal.status}
                </div>
              </div>

              {/* Rincian Kasus */}
              <div className="space-y-3 text-xs font-sans border-t border-slate-200 pt-3">
                <div>
                  <h4 className="font-bold uppercase text-[11px] text-slate-700">Jenis Permasalahan:</h4>
                  <p className="mt-0.5">{activeJournal.problemType}</p>
                </div>

                <div>
                  <h4 className="font-bold uppercase text-[11px] text-slate-700">Uraian Fakta & Masalah:</h4>
                  <p className="mt-0.5 whitespace-pre-line leading-relaxed">{activeJournal.problemDescription}</p>
                </div>

                {activeJournal.identificationResult && (
                  <div>
                    <h4 className="font-bold uppercase text-[11px] text-slate-700">Hasil Identifikasi & Diagnosis:</h4>
                    <p className="mt-0.5 leading-relaxed">{activeJournal.identificationResult}</p>
                  </div>
                )}

                {activeJournal.mutualAgreement && (
                  <div>
                    <h4 className="font-bold uppercase text-[11px] text-slate-700">Kesepakatan / Komitmen Bersama:</h4>
                    <p className="mt-0.5 italic leading-relaxed">{activeJournal.mutualAgreement}</p>
                  </div>
                )}

                {activeJournal.followUp && (
                  <div>
                    <h4 className="font-bold uppercase text-[11px] text-slate-700">Rencana Tindak Lanjut:</h4>
                    <p className="mt-0.5 leading-relaxed">{activeJournal.followUp}</p>
                  </div>
                )}
              </div>

              {/* Dokumentasi Foto & GPS pada Lembar Cetak */}
              {activeJournal.documentationPhoto && (
                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  <h4 className="font-bold uppercase text-[11px] text-slate-700">
                    Dokumentasi Fisik & Verifikasi Lokasi GPS:
                  </h4>
                  <div className="border border-slate-300 rounded p-1 bg-white inline-block max-w-full">
                    <img
                      src={activeJournal.documentationPhoto}
                      alt="Dokumentasi"
                      className="max-h-48 object-contain rounded"
                    />
                  </div>
                  {activeJournal.gpsCoordinates && (
                    <p className="text-[10px] text-slate-600 font-mono">
                      Koordinat GPS Terverifikasi: {activeJournal.gpsCoordinates.latitude.toFixed(6)}, {activeJournal.gpsCoordinates.longitude.toFixed(6)} (Akurasi: ±{Math.round(activeJournal.gpsCoordinates.accuracy || 0)} m)
                    </p>
                  )}
                </div>
              )}

              {/* Lembar Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 pt-8 font-sans text-xs">
                <div className="text-center space-y-1">
                  <p className="text-slate-600">Siswa yang Didampingi,</p>
                  <div className="h-20 flex items-center justify-center">
                    {activeJournal.studentSignature ? (
                      <img src={activeJournal.studentSignature} alt="TTD Siswa" className="h-16 mx-auto object-contain" />
                    ) : (
                      <div className="h-16 border-b border-dashed border-slate-300 w-36 mx-auto" />
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{activeJournal.studentName}</p>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-slate-600">Guru Pendamping,</p>
                  <div className="h-20 flex items-center justify-center">
                    {activeJournal.teacherSignature ? (
                      <img src={activeJournal.teacherSignature} alt="TTD Guru" className="h-16 mx-auto object-contain" />
                    ) : (
                      <div className="h-16 border-b border-dashed border-slate-300 w-36 mx-auto" />
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{activeJournal.mentorTeacher}</p>
                  <p className="text-[10px] text-slate-500">NIP. {settings.teacherNip || '.....................'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
