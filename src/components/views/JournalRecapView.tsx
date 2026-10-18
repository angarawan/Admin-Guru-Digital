import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Filter,
  Calendar,
  BookOpen,
} from 'lucide-react';
import {
  TeachingJournal,
  ClassItem,
  AppSettings,
} from '../../types';

interface JournalRecapViewProps {
  journals: TeachingJournal[];
  classes: ClassItem[];
  settings: AppSettings;
}

export const JournalRecapView: React.FC<JournalRecapViewProps> = ({
  journals,
  classes,
  settings,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>(settings.academicYear);
  const [semester, setSemester] = useState<string>(settings.semester);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchClass = selectedClassId === 'all' || j.classId === selectedClassId;
      const matchYear = !academicYear || j.academicYear === academicYear;
      const matchSem = !semester || j.semester === semester;

      let matchMonth = true;
      if (selectedMonth !== 'all') {
        const monthIndex = new Date(j.date).getMonth() + 1;
        matchMonth = String(monthIndex) === selectedMonth;
      }

      return matchClass && matchYear && matchSem && matchMonth;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [journals, selectedClassId, academicYear, semester, selectedMonth]);

  const activeClass = classes.find((c) => c.id === selectedClassId);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Pertemuan Ke-',
      'Hari/Tanggal',
      'Kelas',
      'Jam Pelajaran',
      'Materi / Pokok Bahasan',
      'Kegiatan Pembelajaran',
      'Metode',
      'Hasil & Capaian',
      'Kendala & Solusi',
    ];

    const rows = filteredJournals.map((jr, idx) => {
      const cls = classes.find((c) => c.id === jr.classId);
      return [
        idx + 1,
        `"${jr.day}, ${jr.date}"`,
        `"${cls?.name || jr.classId}"`,
        `"Jam ${jr.periodStart}-${jr.periodEnd}"`,
        `"${jr.topic.replace(/"/g, '""')}"`,
        `"${jr.activities.replace(/"/g, '""')}"`,
        `"${jr.method}"`,
        `"${jr.results.replace(/"/g, '""')}"`,
        `"${jr.obstacles.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"REKAPAN JURNAL MENGAJAR"`,
        `"Guru: ${settings.teacherName} | Tahun Ajaran ${academicYear} (${semester})"`,
        headers.join(','),
        ...rows,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapan_Jurnal_Mengajar_${selectedClassId}_${academicYear}.csv`);
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
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Rekapan Jurnal Mengajar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rekapitulasi ketercapaian materi, tatap muka pertemuan, dan evaluasi pembelajaran semester.
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF / Print
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 no-print">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Filter Rekapan Jurnal
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">Semua Kelas ({journals.length} Jurnal)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">Semua Bulan</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
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
            BUKU JURNAL AGENDA GURU MENGAJAR
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap justify-center gap-3">
            <span>
              Guru Pengajar: <strong className="text-slate-900 dark:text-white">{settings.teacherName}</strong>
            </span>
            <span>·</span>
            <span>
              Mata Pelajaran: <strong className="text-slate-900 dark:text-white">{settings.subject}</strong>
            </span>
            <span>·</span>
            <span>
              Kelas: <strong className="text-slate-900 dark:text-white">{activeClass ? activeClass.name : 'Semua Kelas'}</strong>
            </span>
            <span>·</span>
            <span>
              Tahun Ajaran: <strong className="text-slate-900 dark:text-white">{academicYear}</strong> ({semester})
            </span>
          </div>
        </div>

        {/* Counter Summary Strip */}
        <div className="flex items-center justify-between p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-blue-950 dark:text-blue-200">
              Total Pertemuan Terlaksana: <span className="font-mono">{filteredJournals.length} Sesi Pertemuan</span>
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 italic">
            Kurikulum Merdeka / Pembelajaran Berdiferensiasi
          </span>
        </div>

        {/* Journal Recap Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-y border-slate-300 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-700">Ke-</th>
                <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700">Hari / Tanggal</th>
                <th className="py-2.5 px-3 w-20 border-r border-slate-200 dark:border-slate-700">Kelas</th>
                <th className="py-2.5 px-3 w-24 border-r border-slate-200 dark:border-slate-700">Jam Ke-</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Materi & Tujuan Pembelajaran</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Metode & Kegiatan</th>
                <th className="py-2.5 px-3 w-48">Hasil / Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredJournals.length > 0 ? (
                filteredJournals.map((jr, idx) => {
                  const cls = classes.find((c) => c.id === jr.classId);
                  return (
                    <tr key={jr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400 tabular-nums border-r border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                        <div className="font-semibold text-slate-900 dark:text-white">{jr.day}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{jr.date}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700">
                        {cls?.name || jr.classId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                        Jam {jr.periodStart}-{jr.periodEnd}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                        <div className="font-bold text-slate-900 dark:text-white">{jr.topic}</div>
                        {jr.learningObjective && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {jr.learningObjective}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{jr.method}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {jr.activities || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] text-slate-700 dark:text-slate-300">{jr.results || '-'}</div>
                        {jr.followUp && (
                          <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium mt-1">
                            TL: {jr.followUp}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada agenda jurnal yang sesuai dengan kriteria filter.
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP. 19680315 199303 1 002</p>
          </div>

          <div className="text-right">
            <p className="text-slate-500 dark:text-slate-400">Makassar, {new Date().toISOString().split('T')[0]}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Guru Pengajar</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase text-slate-900 dark:text-white">{settings.teacherName || 'Guru Pengajar'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP. {settings.teacherNip || '.....................'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
