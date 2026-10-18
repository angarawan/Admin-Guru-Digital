import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  FileText,
} from 'lucide-react';
import { TeachingJournal, ClassItem, PeriodTime, AppSettings } from '../../types';
import { Modal } from '../ui/Modal';

interface JournalViewProps {
  journals: TeachingJournal[];
  classes: ClassItem[];
  periods: PeriodTime[];
  settings: AppSettings;
  onSaveJournal: (journal: TeachingJournal) => Promise<void>;
  onDeleteJournal: (id: string) => Promise<void>;
  onBatchDeleteJournals?: (ids: string[]) => Promise<void>;
}

export const JournalView: React.FC<JournalViewProps> = ({
  journals,
  classes,
  periods,
  settings,
  onSaveJournal,
  onDeleteJournal,
  onBatchDeleteJournals,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<TeachingJournal | null>(null);
  const [activeDetailJournal, setActiveDetailJournal] = useState<TeachingJournal | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const [formData, setFormData] = useState<Partial<TeachingJournal>>({
    date: todayStr,
    day: dayNames[new Date().getDay()],
    classId: classes[0]?.id || '',
    subject: settings.subject || 'Matematika',
    periodStart: 1,
    periodEnd: 3,
    topic: '',
    learningObjective: '',
    activities: '',
    method: 'Problem Based Learning (PBL)',
    results: '',
    obstacles: '',
    reflection: '',
    followUp: '',
    driveLink: '',
    academicYear: settings.academicYear,
    semester: settings.semester,
  });

  const handleDateChange = (newDate: string) => {
    const d = new Date(newDate);
    const dayName = !isNaN(d.getTime()) ? dayNames[d.getDay()] : 'Senin';
    setFormData((prev) => ({
      ...prev,
      date: newDate,
      day: dayName,
    }));
  };

  const openAddModal = () => {
    setEditingJournal(null);
    setFormData({
      date: todayStr,
      day: dayNames[new Date().getDay()],
      classId: classes[0]?.id || '',
      subject: settings.subject || 'Matematika',
      periodStart: 1,
      periodEnd: 2,
      topic: '',
      learningObjective: '',
      activities: '',
      method: 'Problem Based Learning (PBL)',
      results: '',
      obstacles: '',
      reflection: '',
      followUp: '',
      driveLink: '',
      academicYear: settings.academicYear,
      semester: settings.semester,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (journal: TeachingJournal) => {
    setEditingJournal(journal);
    setFormData({ ...journal });
    setIsModalOpen(true);
  };

  const openDetailModal = (journal: TeachingJournal) => {
    setActiveDetailJournal(journal);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic || !formData.classId) {
      alert('Mohon isi materi/pokok bahasan dan pilih kelas.');
      return;
    }

    const journal: TeachingJournal = {
      id: editingJournal ? editingJournal.id : `jr-${Date.now()}`,
      date: formData.date || todayStr,
      day: formData.day || 'Senin',
      classId: formData.classId || classes[0]?.id || '',
      subject: formData.subject || settings.subject,
      periodStart: Number(formData.periodStart) || 1,
      periodEnd: Number(formData.periodEnd) || 2,
      topic: formData.topic || '',
      learningObjective: formData.learningObjective || '',
      activities: formData.activities || '',
      method: formData.method || 'Ceramah & Diskusi',
      results: formData.results || '',
      obstacles: formData.obstacles || '',
      reflection: formData.reflection || '',
      followUp: formData.followUp || '',
      driveLink: formData.driveLink || '',
      academicYear: formData.academicYear || settings.academicYear,
      semester: formData.semester || settings.semester,
    };

    await onSaveJournal(journal);
    setIsModalOpen(false);
  };

  const handleDelete = async (journal: TeachingJournal) => {
    if (confirm(`Hapus jurnal pertemuan "${journal.topic}" tanggal ${journal.date}?`)) {
      await onDeleteJournal(journal.id);
      setSelectedIds((prev) => prev.filter((id) => id !== journal.id));
    }
  };

  const filteredJournals = journals.filter((j) => {
    const matchClass = selectedClassFilter === 'all' || j.classId === selectedClassFilter;
    const matchSearch =
      j.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.activities.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.method.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
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
    if (confirm(`Apakah Anda yakin ingin menghapus ${count} jurnal mengajar yang dicentang?`)) {
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Jurnal Mengajar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dokumentasi lengkap proses belajar mengajar, refleksi guru, tindak lanjut, dan dokumentasi Google Drive.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tulis Jurnal Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
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
              title="Centang untuk memilih/menghapus semua jurnal"
            />
            <span>Centang Semua</span>
          </label>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Kelas:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">Semua Kelas ({journals.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari topik, metode, kegiatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {selectedIds.length} jurnal mengajar dicentang
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

      {/* Journals List */}
      <div className="space-y-3">
        {filteredJournals.length > 0 ? (
          filteredJournals.map((jr) => {
            const cls = classes.find((c) => c.id === jr.classId);
            const isSelected = selectedIds.includes(jr.id);
            return (
              <div
                key={jr.id}
                className={`rounded-xl border transition-all p-4 space-y-3 ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(jr.id)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600 mr-1"
                      title="Centang jurnal ini"
                    />
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded">
                      {cls?.name || jr.classId}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {jr.subject}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {jr.day}, {jr.date}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Jam {jr.periodStart}-{jr.periodEnd}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openDetailModal(jr)}
                      className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(jr)}
                      className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(jr)}
                      className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{jr.topic}</h4>
                  {jr.learningObjective && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Tujuan:</span> {jr.learningObjective}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">Metode Pembelajaran:</span>
                    <span>{jr.method || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">Hasil & Capaian:</span>
                    <span className="line-clamp-1">{jr.results || '-'}</span>
                  </div>
                </div>

                {jr.driveLink && (
                  <div className="pt-1">
                    <a
                      href={jr.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Tautan Dokumentasi Google Drive
                    </a>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <BookOpenCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-medium">Belum ada jurnal pembelajaran yang tersimpan.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              + Tulis Jurnal Pertama Anda
            </button>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit Jurnal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJournal ? 'Edit Jurnal Mengajar' : 'Tulis Jurnal Mengajar Baru'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pembelajaran *
              </label>
              <input
                type="date"
                required
                value={formData.date || todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hari
              </label>
              <input
                type="text"
                readOnly
                value={formData.day || 'Senin'}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kelas *
              </label>
              <select
                value={formData.classId || classes[0]?.id || ''}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={formData.subject || settings.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dari Jam Ke-
              </label>
              <select
                value={formData.periodStart !== undefined ? formData.periodStart : 1}
                onChange={(e) => setFormData({ ...formData, periodStart: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              >
                {periods.map((p) => (
                  <option key={p.period} value={p.period}>
                    Jam {p.period} ({p.startTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sampai Jam Ke-
              </label>
              <select
                value={formData.periodEnd !== undefined ? formData.periodEnd : 2}
                onChange={(e) => setFormData({ ...formData, periodEnd: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              >
                {periods.map((p) => (
                  <option key={p.period} value={p.period}>
                    Jam {p.period} ({p.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Materi / Pokok Bahasan *
            </label>
            <input
              type="text"
              required
              value={formData.topic || ''}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Contoh: Turunan Fungsi Aljabar dan Trigonometri"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tujuan Pembelajaran
            </label>
            <textarea
              rows={2}
              value={formData.learningObjective || ''}
              onChange={(e) => setFormData({ ...formData, learningObjective: e.target.value })}
              placeholder="Contoh: Murid mampu menerapkan rumus turunan pada pemecahan masalah kecepatan dan percepatan..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode / Model Pembelajaran
              </label>
              <input
                type="text"
                value={formData.method || ''}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                placeholder="Contoh: Problem Based Learning, Diskusi, Praktik"
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tautan Dokumentasi Google Drive (Opsional)
              </label>
              <input
                type="url"
                value={formData.driveLink || ''}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kegiatan Pembelajaran (Apersepsi, Inti, Penutup)
            </label>
            <textarea
              rows={2}
              value={formData.activities || ''}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              placeholder="Ringkasan langkah-langkah pembelajaran di kelas..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hasil Pembelajaran & Capaian
              </label>
              <textarea
                rows={2}
                value={formData.results || ''}
                onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                placeholder="Catatan ketercapaian pemahaman siswa..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kendala Pembelajaran
              </label>
              <textarea
                rows={2}
                value={formData.obstacles || ''}
                onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                placeholder="Kendala sarana, waktu, atau kesulitan siswa..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Refleksi Guru
              </label>
              <textarea
                rows={2}
                value={formData.reflection || ''}
                onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                placeholder="Refleksi efektivitas model dan respon siswa..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tindak Lanjut Pembelajaran
              </label>
              <textarea
                rows={2}
                value={formData.followUp || ''}
                onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                placeholder="Remedial, pengayaan, tugas mandiri..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              Simpan Jurnal
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Jurnal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Jurnal Mengajar"
        maxWidth="2xl"
      >
        {activeDetailJournal && (
          <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {classes.find((c) => c.id === activeDetailJournal.classId)?.name} · {activeDetailJournal.subject}
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeDetailJournal.day}, {activeDetailJournal.date} (Jam {activeDetailJournal.periodStart} - {activeDetailJournal.periodEnd})
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded">
                TA {activeDetailJournal.academicYear} ({activeDetailJournal.semester})
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h5 className="font-bold text-slate-800 dark:text-white">Materi / Pokok Bahasan:</h5>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-medium">{activeDetailJournal.topic}</p>
              </div>

              {activeDetailJournal.learningObjective && (
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Tujuan Pembelajaran:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.learningObjective}</p>
                </div>
              )}

              {activeDetailJournal.method && (
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Metode & Model:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.method}</p>
                </div>
              )}

              {activeDetailJournal.activities && (
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Kegiatan Pembelajaran:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">{activeDetailJournal.activities}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white">Hasil Pembelajaran:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.results || '-'}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white">Kendala:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.obstacles || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60">
                  <h5 className="font-bold text-blue-900 dark:text-blue-300">Refleksi Guru:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.reflection || '-'}</p>
                </div>
                <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-300">Tindak Lanjut:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.followUp || '-'}</p>
                </div>
              </div>

              {activeDetailJournal.driveLink && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Dokumentasi Google Drive:</span>
                  <a
                    href={activeDetailJournal.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Buka File / Folder
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
