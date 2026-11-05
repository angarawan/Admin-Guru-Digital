import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Filter,
  CheckCircle2,
  Calendar,
  Users,
  Award,
  BookOpenCheck,
  UserCheck,
  MessageSquareHeart,
  School,
  Download,
  Info,
} from 'lucide-react';
import {
  TeachingJournal,
  AttendanceRecord,
  MentoringJournal,
  ReflectionCard,
  ClassItem,
  Student,
  AppSettings,
} from '../../types';

interface LearningImplementationReportProps {
  journals: TeachingJournal[];
  attendance: AttendanceRecord[];
  mentoringJournals: MentoringJournal[];
  reflections: ReflectionCard[];
  classes: ClassItem[];
  students: Student[];
  settings: AppSettings;
}

type ReportTab = 'all' | 'cover' | 'jurnal' | 'absensi' | 'pendampingan' | 'refleksi' | 'pengesahan';

export const LearningImplementationReportView: React.FC<LearningImplementationReportProps> = ({
  journals,
  attendance,
  mentoringJournals,
  reflections,
  classes,
  students,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>(settings.semester || 'Ganjil');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedClassId !== 'all' && !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId('all');
    }
  }, [classes, selectedClassId]);

  // Filter students based on class selection with name fallback
  const filteredStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    const curCls = classes.find((c) => c.id === selectedClassId);
    return students.filter((s) => {
      if (s.classId === selectedClassId) return true;
      if (curCls && s.classId.toLowerCase() === curCls.name.toLowerCase()) return true;
      return false;
    });
  }, [students, selectedClassId, classes]);

  // Filter journals
  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchClass =
        selectedClassId === 'all' ||
        j.classId === selectedClassId ||
        (j.classIds && j.classIds.includes(selectedClassId));
      const matchSemester = !j.semester || j.semester === selectedSemester;
      return matchClass && matchSemester;
    });
  }, [journals, selectedClassId, selectedSemester]);

  // Filter attendance
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchClass = selectedClassId === 'all' || a.classId === selectedClassId;
      const matchSemester = !a.semester || a.semester === selectedSemester;
      return matchClass && matchSemester;
    });
  }, [attendance, selectedClassId, selectedSemester]);

  // Calculate attendance recap per student
  const studentAttendanceStats = useMemo(() => {
    return filteredStudents.map((st) => {
      const records = filteredAttendance.filter((a) => a.studentId === st.id);
      const h = records.filter((r) => r.status === 'H').length;
      const s = records.filter((r) => r.status === 'S').length;
      const i = records.filter((r) => r.status === 'I').length;
      const a = records.filter((r) => r.status === 'A').length;
      const total = h + s + i + a;
      const percent = total > 0 ? Math.round((h / total) * 100) : 100;
      return {
        ...st,
        hadir: h,
        sakit: s,
        izin: i,
        alpa: a,
        total,
        percent,
      };
    });
  }, [filteredStudents, filteredAttendance]);

  // Filter mentoring
  const filteredMentoring = useMemo(() => {
    return mentoringJournals.filter((m) => {
      const matchClass = selectedClassId === 'all' || m.classId === selectedClassId;
      return matchClass;
    });
  }, [mentoringJournals, selectedClassId]);

  // Filter reflections
  const filteredReflections = useMemo(() => {
    return reflections.filter((r) => {
      const matchClass = selectedClassId === 'all' || r.classId === selectedClassId;
      const matchSemester = !r.semester || r.semester === selectedSemester;
      return matchClass && matchSemester;
    });
  }, [reflections, selectedClassId, selectedSemester]);

  // Class name helper
  const getClassName = (cid?: string) => {
    if (!cid) return '-';
    if (cid.includes(',')) {
      return cid
        .split(',')
        .map((id) => classes.find((c) => c.id === id.trim())?.name || id.trim())
        .join(', ');
    }
    return classes.find((c) => c.id === cid)?.name || cid;
  };

  const selectedClassName =
    selectedClassId === 'all'
      ? 'Semua Kelas'
      : classes.find((c) => c.id === selectedClassId)?.name || 'Kelas';

  // Format Indonesian date
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header View & Controls (Hidden when printing) */}
      <div className="print:hidden space-y-4">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white mb-2">
                <FileText className="w-3.5 h-3.5" />
                Dokumen Resmi Portofolio Guru
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Laporan Pelaksanaan Pembelajaran
              </h1>
              <p className="text-xs text-blue-100 max-w-2xl mt-1 leading-relaxed">
                Dokumen terpadu pembelajaran PJOK yang memuat Lembar Cover Resmi, Jurnal Mengajar,
                Rekapitulasi Absensi Murid, Jurnal Pendampingan Siswa, Kartu Refleksi, dan Lembar
                Pengesahan Kepala Sekolah.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Pilih Kelas:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas Terdaftar</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Semester:
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tanggal Pengesahan Dokumen:
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { id: 'all', label: 'Buku Laporan Terpadu (Semua Bagian)', icon: FileText },
              { id: 'cover', label: '1. Cover Laporan', icon: School },
              { id: 'jurnal', label: `2. Jurnal Mengajar (${filteredJournals.length})`, icon: BookOpenCheck },
              { id: 'absensi', label: `3. Absensi Murid (${studentAttendanceStats.length})`, icon: Users },
              { id: 'pendampingan', label: `4. Jurnal Pendampingan (${filteredMentoring.length})`, icon: UserCheck },
              { id: 'refleksi', label: `5. Kartu Refleksi (${filteredReflections.length})`, icon: MessageSquareHeart },
              { id: 'pengesahan', label: '6. Lembar Pengesahan', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ReportTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white text-slate-900 shadow-xl rounded-2xl p-6 sm:p-10 border border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none font-sans">
        
        {/* ======================= BAGIAN 1: COVER RESMI ======================= */}
        {(activeTab === 'all' || activeTab === 'cover') && (
          <section className="min-h-[920px] flex flex-col justify-between p-8 sm:p-12 border-4 border-double border-slate-800 rounded-xl mb-12 print:mb-0 print:min-h-screen print:border-4 print:border-double print:border-slate-900 page-break-after">
            {/* Header Instansi */}
            <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
              <div className="flex items-center justify-center gap-4">
                {settings.schoolLogo ? (
                  <img
                    src={settings.schoolLogo}
                    alt="Logo Sekolah"
                    className="w-20 h-20 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 mx-auto text-blue-700">
                    <School className="w-10 h-10" />
                  </div>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-600">
                PEMERINTAH DAERAH PROVINSI / KABUPATEN
              </h3>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                {settings.schoolName || 'SMA NEGERI / SWASTA INDONESIA'}
              </h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Jl. Pendidikan Olahraga dan Kepemudaan No. 1 • Telp: (021) 123456 • Website / Belajar.id
              </p>
            </div>

            {/* Judul Laporan */}
            <div className="text-center my-12 space-y-4">
              <div className="inline-block px-4 py-1.5 bg-slate-100 border border-slate-400 rounded-md text-xs font-bold uppercase tracking-widest text-slate-800">
                DOKUMEN RESMI PORTOFOLIO GURU
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight leading-snug">
                LAPORAN PELAKSANAAN PEMBELAJARAN
                <br />
                <span className="text-blue-700">
                  {settings.subject || 'PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)'}
                </span>
              </h1>
              <div className="w-28 h-1 bg-slate-800 mx-auto rounded-full" />
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Kelas: {selectedClassName} • Semester {selectedSemester}
                <br />
                Tahun Ajaran {settings.academicYear || '2024/2025'}
              </p>
            </div>

            {/* Identitas Penyusun & Pengesahan */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-6 max-w-xl mx-auto w-full space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Mata Pelajaran</span>
                <span className="col-span-2 font-bold text-slate-900">
                  : {settings.subject || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Guru Pengampu</span>
                <span className="col-span-2 font-bold text-slate-900">
                  : {settings.teacherName || 'Guru PJOK'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">NIP Guru</span>
                <span className="col-span-2 font-mono font-bold text-slate-900">
                  : {settings.teacherNip || '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Kepala Sekolah</span>
                <span className="col-span-2 font-bold text-slate-900">
                  : {settings.principalName || 'Kepala Sekolah'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">NIP Kepala Sekolah</span>
                <span className="col-span-2 font-mono font-bold text-slate-900">
                  : {settings.principalNip || '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Unit Kerja</span>
                <span className="col-span-2 font-bold text-slate-900">
                  : {settings.schoolName || '-'}
                </span>
              </div>
            </div>

            {/* Footer Cover */}
            <div className="text-center pt-8 text-xs font-semibold text-slate-600 border-t border-slate-300">
              KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
              <br />
              REPUBLIK INDONESIA
            </div>
          </section>
        )}

        {/* ======================= BAGIAN 2: JURNAL MENGAJAR ======================= */}
        {(activeTab === 'all' || activeTab === 'jurnal') && (
          <section className="mb-12 page-break-after">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                  I. JURNAL PELAKSANAAN MENGAJAR GURU
                </h2>
                <p className="text-xs text-slate-600">
                  Mata Pelajaran: {settings.subject} • Kelas: {selectedClassName} • Semester: {selectedSemester}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800">
                Total: {filteredJournals.length} Pertemuan
              </span>
            </div>

            {filteredJournals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                      <th className="border border-slate-800 px-2 py-2 text-center w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-24">Tanggal & Hari</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-16">Kelas</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-14">Jam Ke-</th>
                      <th className="border border-slate-800 px-3 py-2 text-left w-48">Materi Pokok PJOK</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">
                        Kegiatan Pembelajaran (Pemanasan, Inti, Pendinginan)
                      </th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-36">Hasil & Capaian Belajar</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-36">Refleksi & Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournals.map((j, idx) => (
                      <tr key={j.id} className="align-top hover:bg-slate-50/50">
                        <td className="border border-slate-800 px-2 py-2 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-800 px-2 py-2">
                          <div className="font-bold">{formatIndoDate(j.date)}</div>
                          <div className="text-[10px] text-slate-500">{j.day}</div>
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-semibold">
                          {getClassName(j.className || j.classId)}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono">
                          {j.periodStart} - {j.periodEnd}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 font-semibold whitespace-pre-line text-slate-900">
                          {j.topic}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 whitespace-pre-line text-slate-800 leading-relaxed">
                          {j.activities || '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-slate-700 whitespace-pre-line">
                          {j.results || '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-slate-700 whitespace-pre-line">
                          {j.reflection && <div><strong>Refleksi:</strong> {j.reflection}</div>}
                          {j.followUp && <div className="mt-1"><strong>Tindak Lanjut:</strong> {j.followUp}</div>}
                          {!j.reflection && !j.followUp && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data jurnal mengajar pada filter kelas dan semester ini.
              </div>
            )}
          </section>
        )}

        {/* ======================= BAGIAN 3: ABSENSI MURID ======================= */}
        {(activeTab === 'all' || activeTab === 'absensi') && (
          <section className="mb-12 page-break-after">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                  II. REKAPITULASI ABSENSI KEHADIRAN MURID
                </h2>
                <p className="text-xs text-slate-600">
                  Mata Pelajaran: {settings.subject} • Kelas: {selectedClassName} • Semester: {selectedSemester}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800">
                Total: {studentAttendanceStats.length} Siswa
              </span>
            </div>

            {studentAttendanceStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                      <th className="border border-slate-800 px-2 py-2 text-center w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-24">NISN</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Nama Murid</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-12">L/P</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-16">Kelas</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-12 bg-emerald-50 text-emerald-800">
                        H
                      </th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-12 bg-amber-50 text-amber-800">
                        S
                      </th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-12 bg-blue-50 text-blue-800">
                        I
                      </th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-12 bg-rose-50 text-rose-800">
                        A
                      </th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-16 font-mono">Total</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-20 font-bold">% Hadir</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAttendanceStats.map((st, idx) => {
                      const isHighAttendance = st.percent >= 85;
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono text-[10px]">
                            {st.nisn || '-'}
                          </td>
                          <td className="border border-slate-800 px-3 py-1.5 font-bold text-slate-900">
                            {st.name}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-semibold">
                            {st.gender}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center">
                            {getClassName(st.classId)}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                            {st.hadir}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-amber-700 bg-amber-50/30">
                            {st.sakit}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                            {st.izin}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                            {st.alpa}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold">
                            {st.total}
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold">
                            {st.percent}%
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center text-[10px] font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                isHighAttendance
                                  ? 'text-emerald-800 bg-emerald-100'
                                  : 'text-rose-800 bg-rose-100'
                              }`}
                            >
                              {isHighAttendance ? 'Baik' : 'Perhatian'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data murid pada kelas yang dipilih.
              </div>
            )}
          </section>
        )}

        {/* ======================= BAGIAN 4: JURNAL PENDAMPINGAN ======================= */}
        {(activeTab === 'all' || activeTab === 'pendampingan') && (
          <section className="mb-12 page-break-after">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                  III. JURNAL PENDAMPINGAN DAN BIMBINGAN SISWA
                </h2>
                <p className="text-xs text-slate-600">
                  Catatan pembinaan fisik, kesehatan, remedial teknik, dan pendampingan individual peserta didik.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800">
                Total: {filteredMentoring.length} Catatan
              </span>
            </div>

            {filteredMentoring.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                      <th className="border border-slate-800 px-2 py-2 text-center w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-24">Tanggal</th>
                      <th className="border border-slate-800 px-3 py-2 text-left w-36">Nama Siswa</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-16">Kelas</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-28">Kategori Kasus</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Permasalahan / Kendala Siswa</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Bentuk Bimbingan & Solusi Guru</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-32">Hasil & Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMentoring.map((m, idx) => (
                      <tr key={m.id} className="align-top hover:bg-slate-50/50">
                        <td className="border border-slate-800 px-2 py-2 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 font-medium">
                          {formatIndoDate(m.date)}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 font-bold text-slate-900">
                          {m.studentName}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-semibold">
                          {getClassName(m.classId)}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 font-bold text-slate-700">
                          {m.problemType || 'Umum'}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-800 whitespace-pre-line leading-relaxed">
                          {m.problemDescription}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-800 whitespace-pre-line leading-relaxed">
                          {m.mentoringSteps}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-slate-700 whitespace-pre-line">
                          {m.mutualAgreement || m.followUp || m.status || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data jurnal pendampingan pada filter ini.
              </div>
            )}
          </section>
        )}

        {/* ======================= BAGIAN 5: KARTU REFLEKSI ======================= */}
        {(activeTab === 'all' || activeTab === 'refleksi') && (
          <section className="mb-12 page-break-after">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                  IV. KARTU REFLEKSI PEMBELAJARAN
                </h2>
                <p className="text-xs text-slate-600">
                  Umpan balik proses belajar, pemahaman materi gerak, kesulitan siswa, dan catatan evaluasi guru.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800">
                Total: {filteredReflections.length} Refleksi
              </span>
            </div>

            {filteredReflections.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                      <th className="border border-slate-800 px-2 py-2 text-center w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-24">Tanggal</th>
                      <th className="border border-slate-800 px-3 py-2 text-left w-36">Nama Siswa</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-16">Kelas</th>
                      <th className="border border-slate-800 px-3 py-2 text-left w-36">Materi PJOK</th>
                      <th className="border border-slate-800 px-2 py-2 text-center w-20">Emosi / Respon</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Hal yang Dipahami & Diminati</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Kendala & Perbaikan Siswa</th>
                      <th className="border border-slate-800 px-2 py-2 text-left w-36">Catatan & Umpan Balik Guru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReflections.map((r, idx) => (
                      <tr key={r.id} className="align-top hover:bg-slate-50/50">
                        <td className="border border-slate-800 px-2 py-2 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 font-medium">
                          {formatIndoDate(r.date)}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 font-bold text-slate-900">
                          {r.studentName}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-semibold">
                          {getClassName(r.classId)}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 font-semibold text-slate-900">
                          {r.topic}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                            {r.emotion || 'Senang'}
                          </span>
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-800 whitespace-pre-line leading-relaxed">
                          {r.understood && <div><strong>Dipahami:</strong> {r.understood}</div>}
                          {r.interestingParts && <div className="mt-1"><strong>Menarik:</strong> {r.interestingParts}</div>}
                          {!r.understood && !r.interestingParts && '-'}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-800 whitespace-pre-line leading-relaxed">
                          {r.difficulties && <div><strong>Kesulitan:</strong> {r.difficulties}</div>}
                          {r.improvements && <div className="mt-1"><strong>Rencana Perbaikan:</strong> {r.improvements}</div>}
                          {!r.difficulties && !r.improvements && '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-slate-700 whitespace-pre-line">
                          {r.teacherNotes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data kartu refleksi pada filter ini.
              </div>
            )}
          </section>
        )}

        {/* ======================= BAGIAN 6: LEMBAR PENGESAHAN ======================= */}
        {(activeTab === 'all' || activeTab === 'pengesahan') && (
          <section className="pt-8">
            <div className="border-t-2 border-slate-900 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <p className="text-xs text-slate-600">
                    Dokumen ini disusun sebagai wujud pertanggungjawaban profesionalisme guru dan
                    pelaporan keterlaksanaan kegiatan belajar mengajar PJOK.
                  </p>
                </div>
                <div className="text-right text-xs font-semibold text-slate-700">
                  Ditetapkan pada: {formatIndoDate(reportDate)}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-10 text-center text-xs">
                <div className="space-y-16">
                  <div>
                    <p className="font-semibold text-slate-700">Mengetahui,</p>
                    <p className="font-bold text-slate-900 uppercase">Kepala Sekolah</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900 text-sm">
                      {settings.principalName || 'Nama Kepala Sekolah'}
                    </p>
                    <p className="text-slate-600 font-mono">
                      NIP. {settings.principalNip || '_________________________'}
                    </p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="font-semibold text-slate-700">Guru Mata Pelajaran,</p>
                    <p className="font-bold text-slate-900 uppercase">PJOK</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900 text-sm">
                      {settings.teacherName || 'Nama Guru PJOK'}
                    </p>
                    <p className="text-slate-600 font-mono">
                      NIP. {settings.teacherNip || '_________________________'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
