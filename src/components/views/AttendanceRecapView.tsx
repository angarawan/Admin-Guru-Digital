import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Calendar,
  Users,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  AttendanceRecord,
  AppSettings,
} from '../../types';

interface AttendanceRecapViewProps {
  students: Student[];
  classes: ClassItem[];
  attendance: AttendanceRecord[];
  settings: AppSettings;
}

export const AttendanceRecapView: React.FC<AttendanceRecapViewProps> = ({
  students,
  classes,
  attendance,
  settings,
}) => {
  // Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [academicYear, setAcademicYear] = useState<string>(settings.academicYear);
  const [semester, setSemester] = useState<string>(settings.semester);

  // Default date range: start of month to today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const activeClass = classes.find((c) => c.id === selectedClassId);

  // Filter students
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // Filter attendance records by range, class, and semester
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchClass = a.classId === selectedClassId;
      const matchDate = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
      const matchYear = !academicYear || a.academicYear === academicYear;
      const matchSem = !semester || a.semester === semester;
      return matchClass && matchDate && matchYear && matchSem;
    });
  }, [attendance, selectedClassId, startDate, endDate, academicYear, semester]);

  // Aggregate attendance per student
  const studentStats = useMemo(() => {
    return classStudents.map((st) => {
      const records = filteredAttendance.filter((a) => a.studentId === st.id);
      const h = records.filter((r) => r.status === 'H').length;
      const s = records.filter((r) => r.status === 'S').length;
      const i = records.filter((r) => r.status === 'I').length;
      const a = records.filter((r) => r.status === 'A').length;
      const total = h + s + i + a;
      const percentage = total > 0 ? Math.round((h / total) * 100) : 0;

      return {
        student: st,
        h,
        s,
        i,
        a,
        total,
        percentage,
      };
    });
  }, [classStudents, filteredAttendance]);

  // Class overall averages
  const classTotals = useMemo(() => {
    let sumH = 0;
    let sumS = 0;
    let sumI = 0;
    let sumA = 0;
    let sumTotal = 0;

    studentStats.forEach((st) => {
      sumH += st.h;
      sumS += st.s;
      sumI += st.i;
      sumA += st.a;
      sumTotal += st.total;
    });

    const avgRate = sumTotal > 0 ? Math.round((sumH / sumTotal) * 100) : 0;

    return { sumH, sumS, sumI, sumA, sumTotal, avgRate };
  }, [studentStats]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'No',
      'NIS',
      'Nama Murid',
      'Hadir (H)',
      'Sakit (S)',
      'Izin (I)',
      'Alpa (A)',
      'Total Pertemuan',
      'Persentase Kehadiran (%)',
    ];

    const rows = studentStats.map((item, idx) => [
      idx + 1,
      `"${item.student.nis}"`,
      `"${item.student.name}"`,
      item.h,
      item.s,
      item.i,
      item.a,
      item.total,
      `${item.percentage}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"REKAPAN ABSENSI KELAS ${activeClass?.name || selectedClassId}"`,
        `"Periode: ${startDate} s.d ${endDate} | Tahun Ajaran ${academicYear} (${semester})"`,
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekapan_Absensi_${activeClass?.name}_${startDate}_sd_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Rekapan Absensi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Laporan rekapitulasi kehadiran murid periodik dengan kalkulasi persentase, ekspor CSV, dan cetak PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF / Print
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 no-print">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Filter Rekapan Absensi
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tahun Ajaran</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="printable-area bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-4">
        {/* Printable Official Header */}
        <div className="text-center border-b-2 border-slate-800 dark:border-slate-700 pb-3">
          <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
            {settings.schoolName || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI'}
          </h3>
          <h2 className="text-base sm:text-lg font-extrabold uppercase text-slate-950 dark:text-white mt-0.5">
            REKAPITULASI KEHADIRAN MURID
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap justify-center gap-3">
            <span>
              Kelas: <strong className="text-slate-900 dark:text-white">{activeClass?.name}</strong>
            </span>
            <span>·</span>
            <span>
              Periode:{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {startDate || 'Awal'} s.d {endDate || 'Sekarang'}
              </strong>
            </span>
            <span>·</span>
            <span>
              Tahun Ajaran: <strong className="text-slate-900 dark:text-white">{academicYear}</strong> ({semester})
            </span>
          </div>
        </div>

        {/* Counter Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 block text-[11px]">Total Hadir</span>
            <span className="text-lg font-bold text-emerald-950 dark:text-emerald-200 font-mono tabular-nums">
              {classTotals.sumH}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
            <span className="font-semibold text-blue-700 dark:text-blue-400 block text-[11px]">Total Sakit</span>
            <span className="text-lg font-bold text-blue-950 dark:text-blue-200 font-mono tabular-nums">
              {classTotals.sumS}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <span className="font-semibold text-amber-700 dark:text-amber-400 block text-[11px]">Total Izin</span>
            <span className="text-lg font-bold text-amber-950 dark:text-amber-200 font-mono tabular-nums">
              {classTotals.sumI}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
            <span className="font-semibold text-rose-700 dark:text-rose-400 block text-[11px]">Total Alpa</span>
            <span className="text-lg font-bold text-rose-950 dark:text-rose-200 font-mono tabular-nums">
              {classTotals.sumA}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700">
            <span className="font-medium text-slate-300 block text-[11px]">Rata-rata Kelas</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {classTotals.avgRate}%
            </span>
          </div>
        </div>

        {/* Attendance Recap Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-y border-slate-300 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-700">No</th>
                <th className="py-2 px-3 w-28 border-r border-slate-200 dark:border-slate-700">NIS</th>
                <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Nama Murid</th>
                <th className="py-2 px-3 text-center w-16 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/30">H</th>
                <th className="py-2 px-3 text-center w-16 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/30">S</th>
                <th className="py-2 px-3 text-center w-16 border-r border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/30">I</th>
                <th className="py-2 px-3 text-center w-16 border-r border-slate-200 dark:border-slate-700 bg-rose-50/50 dark:bg-rose-950/30">A</th>
                <th className="py-2 px-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">Total Sesi</th>
                <th className="py-2 px-3 text-center w-28">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {studentStats.length > 0 ? (
                studentStats.map((item, idx) => {
                  const isWarning = item.percentage < 75 && item.total > 0;
                  return (
                    <tr key={item.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2 px-3 text-center font-mono text-slate-500 dark:text-slate-400 tabular-nums border-r border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums border-r border-slate-200 dark:border-slate-700">
                        {item.student.nis}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                        {item.student.name}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                        {item.h}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-blue-700 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                        {item.s}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                        {item.i}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-rose-700 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20 border-r border-slate-200 dark:border-slate-700 tabular-nums font-bold">
                        {item.a}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                        {item.total}
                      </td>
                      <td className="py-2 px-3 text-center font-mono tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold ${
                            isWarning
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-extrabold border border-rose-300 dark:border-rose-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada data murid pada kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Teacher Signature Area */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-800 dark:text-slate-200">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Mengetahui,</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase text-slate-900 dark:text-white">Dr. H. Ahmad Dahlan, M.Pd</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">NIP. 19680315 199303 1 002</p>
          </div>

          <div className="text-right">
            <p className="text-slate-500 dark:text-slate-400">Makassar, {todayStr}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Guru Pengajar / Wali Kelas</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase text-slate-900 dark:text-white">{settings.teacherName || 'Guru Pengajar'}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">NIP. {settings.teacherNip || '.....................'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
