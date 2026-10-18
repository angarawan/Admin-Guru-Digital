import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react';
import { ScheduleItem, ClassItem, PeriodTime, DayOfWeek, AppSettings } from '../../types';
import { Modal } from '../ui/Modal';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  classes: ClassItem[];
  periods: PeriodTime[];
  settings: AppSettings;
  onSaveSchedule: (item: ScheduleItem) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  classes,
  periods,
  settings,
  onSaveSchedule,
  onDeleteSchedule,
}) => {
  const days: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ScheduleItem>>({
    day: 'Senin',
    classId: classes[0]?.id || '',
    subject: settings.subject || 'Matematika',
    periodStart: 1,
    periodEnd: 2,
    startTime: '07:30',
    endTime: '09:00',
    room: 'Ruang Kelas',
    notes: '',
  });

  const handlePeriodChange = (start: number, end: number) => {
    const pStart = periods.find((p) => p.period === start);
    const pEnd = periods.find((p) => p.period === end);
    setFormData((prev) => ({
      ...prev,
      periodStart: start,
      periodEnd: end,
      startTime: pStart ? pStart.startTime : prev.startTime,
      endTime: pEnd ? pEnd.endTime : prev.endTime,
    }));
  };

  const openAddModal = (defaultDay?: DayOfWeek) => {
    setEditingSchedule(null);
    const pStart = periods.find((p) => p.period === 1);
    const pEnd = periods.find((p) => p.period === 2);
    setFormData({
      day: defaultDay || 'Senin',
      classId: classes[0]?.id || '',
      subject: settings.subject || 'Matematika',
      periodStart: 1,
      periodEnd: 2,
      startTime: pStart ? pStart.startTime : '07:30',
      endTime: pEnd ? pEnd.endTime : '09:00',
      room: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sch: ScheduleItem) => {
    setEditingSchedule(sch);
    setFormData({ ...sch });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.subject) {
      alert('Mohon pilih kelas dan isi mata pelajaran.');
      return;
    }

    const item: ScheduleItem = {
      id: editingSchedule ? editingSchedule.id : `sch-${Date.now()}`,
      day: (formData.day as DayOfWeek) || 'Senin',
      classId: formData.classId || classes[0]?.id || '',
      subject: formData.subject || settings.subject,
      periodStart: Number(formData.periodStart) || 1,
      periodEnd: Number(formData.periodEnd) || 2,
      startTime: formData.startTime || '07:30',
      endTime: formData.endTime || '09:00',
      room: formData.room || '',
      notes: formData.notes || '',
    };

    await onSaveSchedule(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (sch: ScheduleItem) => {
    if (confirm(`Hapus jadwal ${sch.subject} hari ${sch.day}?`)) {
      await onDeleteSchedule(sch.id);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    if (selectedDayFilter === 'all') return true;
    return s.day === selectedDayFilter;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Jadwal Mengajar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Atur jadwal tatap muka mingguan berdasarkan hari Senin sampai Sabtu dan jam pelajaran 0–10.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal
        </button>
      </div>

      {/* Day Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedDayFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          Semua Hari ({schedules.length})
        </button>
        {days.map((day) => {
          const count = schedules.filter((s) => s.day === day).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDayFilter === day
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {day} ({count})
            </button>
          );
        })}
      </div>

      {/* Schedules List by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(selectedDayFilter === 'all' ? days : [selectedDayFilter as DayOfWeek]).map((day) => {
          const dayItems = schedules.filter((s) => s.day === day);
          dayItems.sort((a, b) => a.periodStart - b.periodStart);

          return (
            <div
              key={day}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {day}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal(day)}
                  className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  title={`Tambah jadwal hari ${day}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>

              <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                {dayItems.length > 0 ? (
                  dayItems.map((sch) => {
                    const cls = classes.find((c) => c.id === sch.classId);
                    return (
                      <div key={sch.id} className="py-2.5 first:pt-1 last:pb-1 group">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                                {cls?.name || sch.classId}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                {sch.subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                Jam {sch.periodStart}-{sch.periodEnd} ({sch.startTime} - {sch.endTime})
                              </span>
                            </div>
                            {sch.room && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                Ruang: {sch.room}
                              </div>
                            )}
                            {sch.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-1">
                                {sch.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openEditModal(sch)}
                              className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sch)}
                              className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                    Belum ada jadwal mengajar pada hari {day}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Schedule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hari *
              </label>
              <select
                value={formData.day || 'Senin'}
                onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mata Pelajaran *
            </label>
            <input
              type="text"
              required
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Contoh: Matematika Peminatan"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dari Jam Ke-
              </label>
              <select
                value={formData.periodStart !== undefined ? formData.periodStart : 1}
                onChange={(e) =>
                  handlePeriodChange(Number(e.target.value), Number(formData.periodEnd || e.target.value))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              >
                {periods.map((p) => (
                  <option key={p.period} value={p.period}>
                    Jam {p.period}
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
                onChange={(e) =>
                  handlePeriodChange(Number(formData.periodStart || 1), Number(e.target.value))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              >
                {periods.map((p) => (
                  <option key={p.period} value={p.period}>
                    Jam {p.period}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Waktu Mulai
              </label>
              <input
                type="time"
                value={formData.startTime || '07:30'}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Waktu Selesai
              </label>
              <input
                type="time"
                value={formData.endTime || '09:00'}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ruangan / Lokasi Belajar
              </label>
              <input
                type="text"
                value={formData.room || ''}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Contoh: R. 11 MIPA 1 / Lab Komputer"
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan / Topik Rencana
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contoh: Tatap Muka & Diskusi"
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
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
              Simpan Jadwal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
