import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Printer,
  Smile,
  Meh,
  Frown,
  Eye,
  Calendar,
} from 'lucide-react';
import {
  ReflectionCard,
  Student,
  ClassItem,
  AppSettings,
  ReflectionEmotion,
} from '../../types';
import { Modal } from '../ui/Modal';

interface ReflectionCardViewProps {
  reflections: ReflectionCard[];
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  onSaveReflection: (card: ReflectionCard) => Promise<void>;
  onDeleteReflection: (id: string) => Promise<void>;
  onBatchDeleteReflections?: (ids: string[]) => Promise<void>;
}

export const ReflectionCardView: React.FC<ReflectionCardViewProps> = ({
  reflections,
  students,
  classes,
  settings,
  onSaveReflection,
  onDeleteReflection,
  onBatchDeleteReflections,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ReflectionCard | null>(null);
  const [activeCard, setActiveCard] = useState<ReflectionCard | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState<Partial<ReflectionCard>>({
    date: todayStr,
    classId: classes[0]?.id || '',
    studentId: students[0]?.id || '',
    studentName: students[0]?.name || '',
    topic: '',
    understood: '',
    difficulties: '',
    interestingParts: '',
    improvements: '',
    emotion: 'Senang',
    teacherNotes: '',
    followUp: '',
    academicYear: settings.academicYear,
    semester: settings.semester,
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

  const openAddModal = () => {
    setEditingCard(null);
    const firstStudent = students[0];
    setFormData({
      date: todayStr,
      classId: firstStudent?.classId || classes[0]?.id || '',
      studentId: firstStudent?.id || '',
      studentName: firstStudent?.name || '',
      topic: '',
      understood: '',
      difficulties: '',
      interestingParts: '',
      improvements: '',
      emotion: 'Senang',
      teacherNotes: '',
      followUp: '',
      academicYear: settings.academicYear,
      semester: settings.semester,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (card: ReflectionCard) => {
    setEditingCard(card);
    setFormData({ ...card });
    setIsModalOpen(true);
  };

  const openDetailModal = (card: ReflectionCard) => {
    setActiveCard(card);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.topic) {
      alert('Mohon pilih murid dan isi topik materi pembelajaran.');
      return;
    }

    const item: ReflectionCard = {
      id: editingCard ? editingCard.id : `ref-${Date.now()}`,
      date: formData.date || todayStr,
      classId: formData.classId || classes[0]?.id || '',
      studentId: formData.studentId || '',
      studentName: formData.studentName || '',
      topic: formData.topic || '',
      understood: formData.understood || '',
      difficulties: formData.difficulties || '',
      interestingParts: formData.interestingParts || '',
      improvements: formData.improvements || '',
      emotion: (formData.emotion as ReflectionEmotion) || 'Senang',
      teacherNotes: formData.teacherNotes || '',
      followUp: formData.followUp || '',
      academicYear: formData.academicYear || settings.academicYear,
      semester: formData.semester || settings.semester,
    };

    await onSaveReflection(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (card: ReflectionCard) => {
    if (confirm(`Hapus kartu refleksi ${card.studentName} topik "${card.topic}"?`)) {
      await onDeleteReflection(card.id);
      setSelectedIds((prev) => prev.filter((id) => id !== card.id));
    }
  };

  const filteredReflections = reflections.filter((r) => {
    const matchClass = selectedClassFilter === 'all' || r.classId === selectedClassFilter;
    const matchEmotion = emotionFilter === 'all' || r.emotion === emotionFilter;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchEmotion && matchSearch;
  });

  const isAllSelected = filteredReflections.length > 0 && filteredReflections.every((r) => selectedIds.includes(r.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReflections.map((r) => r.id));
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
    if (confirm(`Apakah Anda yakin ingin menghapus ${count} kartu refleksi yang dicentang?`)) {
      if (onBatchDeleteReflections) {
        await onBatchDeleteReflections(selectedIds);
      } else {
        for (const id of selectedIds) {
          await onDeleteReflection(id);
        }
      }
      setSelectedIds([]);
    }
  };

  const getEmotionBadge = (emotion: ReflectionEmotion) => {
    switch (emotion) {
      case 'Senang':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Smile className="w-4 h-4 text-emerald-600" />
            Senang
          </span>
        );
      case 'Biasa saja':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Meh className="w-4 h-4 text-blue-600" />
            Biasa Saja
          </span>
        );
      case 'Kesulitan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
            <Frown className="w-4 h-4 text-rose-600" />
            Kesulitan
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Kartu Refleksi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catatan umpan balik murid, perasaan setelah belajar (Senang/Biasa saja/Kesulitan), dan tindak lanjut guru.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tulis Kartu Refleksi
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              title="Centang untuk memilih/menghapus semua refleksi"
            />
            <span>Centang Semua</span>
          </label>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Semua Kelas ({reflections.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Semua Emosi</option>
            <option value="Senang">Senang</option>
            <option value="Biasa saja">Biasa Saja</option>
            <option value="Kesulitan">Kesulitan</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari murid atau materi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {selectedIds.length} kartu refleksi dicentang
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              dari total {filteredReflections.length} refleksi
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
              {isAllSelected ? 'Hapus Centang Semua' : `Centang Semua (${filteredReflections.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedIds.length === filteredReflections.length ? 'Semua Refleksi' : `${selectedIds.length} Refleksi Terpilih`}
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReflections.length > 0 ? (
          filteredReflections.map((card) => {
            const cls = classes.find((c) => c.id === card.classId);
            const isSelected = selectedIds.includes(card.id);
            return (
              <div
                key={card.id}
                className={`rounded-xl border transition-all p-4 space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(card.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title="Centang kartu refleksi ini"
                      />
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {card.date}
                      </span>
                    </div>
                    {getEmotionBadge(card.emotion)}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{card.studentName}</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                      {cls?.name || card.classId} · {card.topic}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Sudah Dipahami:</span>
                      <p className="line-clamp-2 text-slate-600 dark:text-slate-300 mt-0.5">{card.understood || '-'}</p>
                    </div>
                    {card.difficulties && (
                      <div>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">Kesulitan:</span>
                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300 mt-0.5">{card.difficulties}</p>
                      </div>
                    )}
                  </div>

                  {card.teacherNotes && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 italic">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 not-italic">Catatan Guru:</span>{' '}
                      {card.teacherNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => openDetailModal(card)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Lengkap
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(card)}
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(card)}
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <MessageSquareHeart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-medium">Belum ada kartu refleksi yang tersimpan.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              + Buat Kartu Refleksi Pertama
            </button>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Reflection */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCard ? 'Edit Kartu Refleksi' : 'Tulis Kartu Refleksi Belajar'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Refleksi *
              </label>
              <input
                type="date"
                required
                value={formData.date || todayStr}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Murid *
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Materi Pembelajaran *
            </label>
            <input
              type="text"
              required
              value={formData.topic || ''}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Contoh: Turunan Fungsi Komposisi"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Emoji Selection Bar (Mandatory per section 11) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Perasaan Setelah Pembelajaran:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Senang', 'Biasa saja', 'Kesulitan'] as ReflectionEmotion[]).map((emo) => {
                const isSelected = formData.emotion === emo;
                const Icon = emo === 'Senang' ? Smile : emo === 'Biasa saja' ? Meh : Frown;
                return (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setFormData({ ...formData, emotion: emo })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {emo}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apa yang sudah dipahami murid?
              </label>
              <textarea
                rows={2}
                value={formData.understood || ''}
                onChange={(e) => setFormData({ ...formData, understood: e.target.value })}
                placeholder="Konsep atau rumus yang berhasil dikuasai..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apa kesulitan yang dialami?
              </label>
              <textarea
                rows={2}
                value={formData.difficulties || ''}
                onChange={(e) => setFormData({ ...formData, difficulties: e.target.value })}
                placeholder="Langkah atau soal yang masih membingungkan..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apa hal menarik dari pembelajaran?
              </label>
              <textarea
                rows={2}
                value={formData.interestingParts || ''}
                onChange={(e) => setFormData({ ...formData, interestingParts: e.target.value })}
                placeholder="Aktivitas, diskusi, atau materi favorit siswa..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apa yang perlu diperbaiki ke depan?
              </label>
              <textarea
                rows={2}
                value={formData.improvements || ''}
                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                placeholder="Rekomendasi metode, ritme, atau latihan..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Guru
              </label>
              <textarea
                rows={2}
                value={formData.teacherNotes || ''}
                onChange={(e) => setFormData({ ...formData, teacherNotes: e.target.value })}
                placeholder="Observasi guru terhadap murid bersangkutan..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                placeholder="Penguatan, latihan mandiri, pendampingan..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
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
              Simpan Kartu Refleksi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail / Cetak Refleksi */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Kartu Refleksi Murid"
        maxWidth="lg"
      >
        {activeCard && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{activeCard.studentName}</span>
                <p className="text-slate-500 dark:text-slate-400">
                  {classes.find((c) => c.id === activeCard.classId)?.name} · {activeCard.date}
                </p>
              </div>
              {getEmotionBadge(activeCard.emotion)}
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Materi Pembelajaran:</span>
                <p className="text-slate-700 dark:text-slate-300">{activeCard.topic}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Yang Sudah Dipahami:</span>
                <p className="text-slate-700 dark:text-slate-300">{activeCard.understood || '-'}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Kesulitan yang Dialami:</span>
                <p className="text-slate-700 dark:text-slate-300">{activeCard.difficulties || '-'}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Hal Menarik:</span>
                <p className="text-slate-700 dark:text-slate-300">{activeCard.interestingParts || '-'}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Yang Perlu Diperbaiki:</span>
                <p className="text-slate-700 dark:text-slate-300">{activeCard.improvements || '-'}</p>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/60 space-y-1">
                <span className="font-bold text-blue-900 dark:text-blue-300 block">Catatan & Tindak Lanjut Guru:</span>
                <p className="text-slate-700 dark:text-slate-300">{activeCard.teacherNotes || '-'}</p>
                {activeCard.followUp && (
                  <p className="text-slate-700 dark:text-slate-300 font-semibold mt-1">Tindak Lanjut: {activeCard.followUp}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Kartu
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
    </div>
  );
};
