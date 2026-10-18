import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { Student, ClassItem, AppSettings } from '../../types';
import { Modal } from '../ui/Modal';

interface StudentsViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: AppSettings;
  onSaveStudent: (student: Student) => Promise<void>;
  onBatchSaveStudents: (students: Student[]) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onBatchDeleteStudents?: (ids: string[]) => Promise<void>;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  settings,
  onSaveStudent,
  onBatchSaveStudents,
  onDeleteStudent,
  onBatchDeleteStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    classId: classes[0]?.id || '',
    academicYear: settings.academicYear,
    isActive: true,
  });

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<Student[]>([]);
  const [importError, setImportError] = useState('');

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = selectedClass === 'all' || s.classId === selectedClass;
      return matchSearch && matchClass;
    });
  }, [students, searchTerm, selectedClass]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      classId: selectedClass !== 'all' ? selectedClass : classes[0]?.id || '',
      academicYear: settings.academicYear,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis) {
      alert('Mohon isi nama murid dan NIS.');
      return;
    }

    const newStudent: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}`,
      nis: formData.nis || '',
      nisn: formData.nisn || '',
      name: formData.name || '',
      gender: (formData.gender as 'L' | 'P') || 'L',
      classId: formData.classId || classes[0]?.id || '',
      academicYear: formData.academicYear || settings.academicYear,
      isActive: formData.isActive !== undefined ? formData.isActive : true,
    };

    await onSaveStudent(newStudent);
    setIsModalOpen(false);
  };

  const handleDelete = async (student: Student) => {
    if (confirm(`Apakah Anda yakin ingin menghapus murid "${student.name}" (NIS: ${student.nis})?`)) {
      await onDeleteStudent(student.id);
      setSelectedIds((prev) => prev.filter((id) => id !== student.id));
    }
  };

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.includes(s.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
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
    if (confirm(`Apakah Anda yakin ingin menghapus ${count} data murid yang dicentang?`)) {
      if (onBatchDeleteStudents) {
        await onBatchDeleteStudents(selectedIds);
      } else {
        for (const id of selectedIds) {
          await onDeleteStudent(id);
        }
      }
      setSelectedIds([]);
    }
  };

  // CSV Parsing
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    setImportError('');
    if (!text.trim()) {
      setImportPreview([]);
      return;
    }

    try {
      const lines = text.trim().split(/\r\n|\n/);
      if (lines.length < 2) {
        setImportError('Format CSV minimal memiliki 1 baris header dan 1 baris data.');
        return;
      }

      // Expected columns: NIS, NISN, Nama, Gender(L/P), Kelas(Nama atau ID), Status(Aktif/Nonaktif)
      const parsed: Student[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 3) {
          const nis = cols[0] || '';
          const nisn = cols[1] || '';
          const name = cols[2] || '';
          const gender = (cols[3]?.toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P';
          
          // Match class by name or fallback
          const rawClass = cols[4] || '';
          const foundClass = classes.find((c) => c.name.toLowerCase() === rawClass.toLowerCase() || c.id === rawClass);
          const classId = foundClass ? foundClass.id : (selectedClass !== 'all' ? selectedClass : classes[0]?.id || '');

          parsed.push({
            id: `std-${Date.now()}-${i}`,
            nis,
            nisn,
            name,
            gender,
            classId,
            academicYear: settings.academicYear,
            isActive: cols[5] ? cols[5].toLowerCase() !== 'nonaktif' : true,
          });
        }
      }

      setImportPreview(parsed);
    } catch (e: any) {
      setImportError('Gagal membaca format CSV: ' + e.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importPreview.length === 0) return;
    await onBatchSaveStudents(importPreview);
    setIsImportModalOpen(false);
    setCsvText('');
    setImportPreview([]);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['NIS', 'NISN', 'Nama Murid', 'Jenis Kelamin', 'Kelas', 'Tahun Ajaran', 'Status'];
    const rows = filteredStudents.map((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      return [
        `"${s.nis}"`,
        `"${s.nisn}"`,
        `"${s.name}"`,
        `"${s.gender}"`,
        `"${cls?.name || s.classId}"`,
        `"${s.academicYear}"`,
        `"${s.isActive ? 'Aktif' : 'Nonaktif'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Murid_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Data Murid
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sumber data utama seluruh administrasi: absensi, penilaian, jurnal pendampingan, dan refleksi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Murid
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Semua Kelas ({students.length})</option>
            {classes.map((cls) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              return (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({count} murid)
                </option>
              );
            })}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Bulk Delete & Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {selectedIds.length} murid dicentang
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              dari total {filteredStudents.length} murid
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
              {isAllSelected ? 'Hapus Centang Semua' : `Centang Semua (${filteredStudents.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedIds.length === filteredStudents.length ? 'Semua Murid' : `${selectedIds.length} Murid Terpilih`}
            </button>
          </div>
        </div>
      )}

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    title="Centang untuk memilih/menghapus semua murid"
                  />
                </th>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-4 text-center">L/P</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Tahun Ajaran</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, idx) => {
                  const studentClass = classes.find((c) => c.id === student.classId);
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(student.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                        {student.nis}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {student.nisn || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            student.gender === 'L'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-transparent dark:border-slate-700">
                          {studentClass?.name || student.classId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {student.academicYear}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {student.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                          title="Edit Murid"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student)}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Hapus Murid"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    Tidak ada data murid yang sesuai filter atau pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, filteredStudents.length)} dari {filteredStudents.length} murid
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Sebelumnya
              </button>
              <span className="text-xs font-medium px-2 text-slate-600 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Student */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Data Murid' : 'Tambah Murid Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIS (Nomor Induk Siswa) *
              </label>
              <input
                type="text"
                required
                value={formData.nis || ''}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Contoh: 24101"
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NISN (Nasional)
              </label>
              <input
                type="text"
                value={formData.nisn || ''}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="Contoh: 0071234567"
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Murid *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Muhammad Farhan"
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.gender || 'L'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kelas
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Keaktifan
              </label>
              <select
                value={formData.isActive ? '1' : '0'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === '1' })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
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
              Simpan Data Murid
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Import CSV */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Murid dari File CSV"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-xs text-blue-900 dark:text-blue-300 space-y-1">
            <p className="font-semibold">Format Kolom CSV:</p>
            <code className="block bg-white dark:bg-slate-900 p-2 rounded border border-blue-200 dark:border-blue-900/60 font-mono text-[11px] text-slate-800 dark:text-slate-200">
              NIS,NISN,Nama Murid,L/P,Nama Kelas,Status
              <br />
              24101,0071234501,Ahmad Fauzan,L,XI-MIPA 1,Aktif
              <br />
              24102,0071234502,Bunga Citra,P,XI-MIPA 1,Aktif
            </code>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih File CSV dari Komputer:
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Atau Tempel (Paste) Teks CSV di bawah:
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder="Tempel isi CSV di sini..."
              className="w-full text-xs font-mono p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:placeholder-slate-500"
            />
          </div>

          {importError && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Pratinjau Hasil Pembacaan ({importPreview.length} Murid):
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Siap Diimpor</span>
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {importPreview.slice(0, 8).map((p, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      NIS: {p.nis} · {p.gender}
                    </span>
                  </div>
                ))}
                {importPreview.length > 8 && (
                  <div className="p-2 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 italic">
                    ... dan {importPreview.length - 8} murid lainnya
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={importPreview.length === 0}
              onClick={handleExecuteImport}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              Simpan {importPreview.length} Murid
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
