import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ClassItem, Student, AppSettings, NavigationMenu } from '../../types';
import { Modal } from '../ui/Modal';

interface ClassesViewProps {
  classes: ClassItem[];
  students: Student[];
  settings: AppSettings;
  onSaveClass: (item: ClassItem) => Promise<void>;
  onDeleteClass: (id: string, reassignToClassId?: string) => Promise<void>;
  onSyncAllClasses?: () => Promise<{ studentsSynced: number; journalsSynced: number }>;
  onResetToPJOKDefaults?: () => Promise<void>;
  onNavigate?: (menu: NavigationMenu) => void;
  onSelectClassForStudents?: (classId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  settings,
  onSaveClass,
  onDeleteClass,
  onSyncAllClasses,
  onResetToPJOKDefaults,
  onNavigate,
  onSelectClassForStudents,
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    level: string;
    homeroomTeacher: string;
  }>({
    name: '',
    level: 'X',
    homeroomTeacher: '',
  });

  // Action feedback states
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      level: 'X',
      homeroomTeacher: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      homeroomTeacher: cls.homeroomTeacher || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama kelas tidak boleh kosong.');
      return;
    }

    const item: ClassItem = {
      id: editingClass ? editingClass.id : `cls-${Date.now()}`,
      name: formData.name.trim(),
      level: formData.level,
      homeroomTeacher: formData.homeroomTeacher.trim() || undefined,
    };

    await onSaveClass(item);
    setIsModalOpen(false);

    setSyncStatusMsg(`Kelas "${item.name}" berhasil ${editingClass ? 'diperbarui' : 'ditambahkan'} dan tersinkron ke semua fitur!`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleDelete = async (cls: ClassItem) => {
    const studentCount = students.filter((s) => s.classId === cls.id).length;
    const confirmMsg =
      studentCount > 0
        ? `Hapus kelas "${cls.name}"? Terdapat ${studentCount} murid di kelas ini yang akan otomatis dipindahkan ke kelas aktif pertama agar data tidak hilang.`
        : `Hapus kelas "${cls.name}"?`;

    if (confirm(confirmMsg)) {
      await onDeleteClass(cls.id);
      setSyncStatusMsg(`Kelas "${cls.name}" berhasil dihapus.`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      if (onSyncAllClasses) {
        const res = await onSyncAllClasses();
        setSyncStatusMsg(
          `Sinkronisasi tuntas! Seluruh ${classes.length} kelas telah tersinkron dengan ${students.length} data murid dan jurnal mengajar.`
        );
      } else {
        setSyncStatusMsg('Semua data kelas telah tersinkronisasi dengan baik.');
      }
    } catch (e: any) {
      setSyncStatusMsg('Gagal sinkronisasi: ' + e.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const handleQuickResetPJOK = async () => {
    if (
      confirm(
        'Format Ulang Kelas ke Standar PJOK (X-1, X-2, XI-1, XI-2, XII-1)? Tindakan ini akan menyelaraskan seluruh daftar rombel ke penamaan standar PJOK tanpa demo Matematika lama.'
      )
    ) {
      setIsSyncing(true);
      try {
        if (onResetToPJOKDefaults) {
          await onResetToPJOKDefaults();
        }
        setSyncStatusMsg('Berhasil! Seluruh kelas dan data telah diperbarui ke standar format PJOK.');
      } catch (e: any) {
        alert('Gagal reset: ' + e.message);
      } finally {
        setIsSyncing(false);
        setTimeout(() => setSyncStatusMsg(null), 5000);
      }
    }
  };

  const handleViewStudentsInClass = (classId: string) => {
    if (onSelectClassForStudents) {
      onSelectClassForStudents(classId);
    }
    if (onNavigate) {
      onNavigate('murid');
    }
  };

  // Group classes by level
  const levels = ['X', 'XI', 'XII'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Data Kelas & Rombel Belajar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {classes.length} Rombel
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola data kelas yang Anda ampu. Perubahan nama kelas akan otomatis tersinkron ke Jurnal Mengajar, Absensi, Penilaian, Rekap, dan Laporan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleManualSync}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title="Sinkronkan data kelas ke semua fitur"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            Sinkronkan ke Semua Fitur
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas Baru
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Rombel / Kelas</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {classes.length}
          </div>
          <span className="text-[11px] text-slate-400">Aktif digunakan di semua fitur</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Murid Terdaftar</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {students.length}
          </div>
          <span className="text-[11px] text-slate-400">{students.filter((s) => s.isActive).length} murid aktif</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Format Cepat PJOK
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Gunakan penamaan seragam X-1, X-2, XI-1, XI-2, XII-1 bebas dari demo lama.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickResetPJOK}
            className="mt-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white underline cursor-pointer"
          >
            Terapkan Format Standar PJOK →
          </button>
        </div>
      </div>

      {/* Class Cards Grid by Level */}
      <div className="space-y-6">
        {levels.map((lvl) => {
          const levelClasses = classes.filter((c) => c.level === lvl);
          if (levelClasses.length === 0) return null;

          return (
            <div key={lvl} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tingkat Kelas {lvl}
                </span>
                <span className="text-[11px] font-mono text-slate-400">({levelClasses.length} Kelas)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levelClasses.map((cls) => {
                  const studentCount = students.filter((s) => s.classId === cls.id).length;
                  const activeStudentCount = students.filter((s) => s.classId === cls.id && s.isActive).length;

                  return (
                    <div
                      key={cls.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all p-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                {cls.name}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                Tingkat {cls.level}
                              </span>
                            </div>
                            {cls.homeroomTeacher ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                Wali: {cls.homeroomTeacher}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic mt-1">Wali kelas belum ditentukan</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(cls)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                              title="Ubah Kelas"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cls)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Student Count Badge */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-900 dark:text-white">{studentCount}</strong> Murid Terdaftar
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {activeStudentCount} aktif
                          </span>
                        </div>
                      </div>

                      {/* Quick link to view students in this class */}
                      <button
                        type="button"
                        onClick={() => handleViewStudentsInClass(cls.id)}
                        className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors border border-slate-200/60 dark:border-slate-700/60"
                      >
                        Lihat Data Murid Kelas {cls.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Classes with other levels if any */}
        {classes.filter((c) => !levels.includes(c.level)).length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kelas Lainnya
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes
                .filter((c) => !levels.includes(c.level))
                .map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{cls.name}</span>
                      <span className="text-xs text-slate-500 block">Tingkat: {cls.level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Sync Information Guide */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
          <HelpCircle className="w-4 h-4" />
          Bagaimana Sinkronisasi Kelas Bekerja?
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Setiap kelas yang Anda buat atau ubah di sini akan <strong>langsung terbaca serentak</strong> di menu{' '}
          <strong>Jurnal Mengajar</strong> (bisa pilih lebih dari 1 kelas), <strong>Absensi Murid</strong>,{' '}
          <strong>Penilaian Pengetahuan</strong>, <strong>Penilaian Keterampilan</strong>,{' '}
          <strong>Penilaian Sikap</strong>, <strong>Rekapan</strong>, dan <strong>Laporan Cetak</strong>.
        </p>
      </div>

      {/* Modal Add / Edit Class */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? `Ubah Data Kelas: ${editingClass.name}` : 'Tambah Kelas Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kelas / Rombel *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: X-1, XI-1, XII-1, X-A, dll."
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Nama ini akan muncul di seluruh dropdown pilihan kelas.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tingkat Kelas *
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="X">Kelas X (Sepuluh)</option>
              <option value="XI">Kelas XI (Sebelas)</option>
              <option value="XII">Kelas XII (Dua Belas)</option>
              <option value="Lainnya">Lainnya / Gabungan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Wali Kelas (Opsional)
            </label>
            <input
              type="text"
              value={formData.homeroomTeacher}
              onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.Pd"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
