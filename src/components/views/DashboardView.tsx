import React from 'react';
import {
  Users,
  Building2,
  CalendarClock,
  CheckSquare,
  BookOpenCheck,
  UserCheck,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AppSettings,
  ClassItem,
  Student,
  ScheduleItem,
  AttendanceRecord,
  TeachingJournal,
  MentoringJournal,
  NavigationMenu,
} from '../../types';

interface DashboardViewProps {
  settings: AppSettings;
  classes: ClassItem[];
  students: Student[];
  schedules: ScheduleItem[];
  attendance: AttendanceRecord[];
  journals: TeachingJournal[];
  mentoringJournals: MentoringJournal[];
  onNavigate: (menu: NavigationMenu) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  classes,
  students,
  schedules,
  attendance,
  journals,
  mentoringJournals,
  onNavigate,
}) => {
  // Determine current day of week in Indonesian
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = dayNames[new Date().getDay()];
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Today's schedule
  const todaySchedules = schedules.filter(
    (s) => s.day.toLowerCase() === todayDayName.toLowerCase()
  );

  // Today's attendance
  const todayAttendance = attendance.filter((a) => a.date === todayDateStr);
  const totalAttendedToday = todayAttendance.filter((a) => a.status === 'H').length;
  const attendanceRateToday =
    todayAttendance.length > 0
      ? Math.round((totalAttendedToday / todayAttendance.length) * 100)
      : null;

  // Active mentoring needing follow up
  const activeMentoring = mentoringJournals.filter(
    (m) => m.status === 'Dalam Pendampingan' || m.status === 'Perlu Tindak Lanjut'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Tahun Ajaran {settings.academicYear} · Semester {settings.semester}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Bertugas, {settings.teacherName || 'Bapak/Ibu Guru'}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Kelola seluruh administrasi pembelajaran kelas, absensi, jurnal mengajar, penilaian,
              dan pendampingan murid secara digital dan terpusat dalam satu aplikasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('absensi')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Absensi Hari Ini
            </button>
            <button
              type="button"
              onClick={() => onNavigate('jurnal')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <BookOpenCheck className="w-4 h-4" />
              Isi Jurnal
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Summary Cards (Mandatory per section 2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Murid */}
        <div
          onClick={() => onNavigate('murid')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Murid</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {students.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {students.filter((s) => s.isActive).length} murid aktif
          </p>
        </div>

        {/* Card 2: Jumlah Kelas */}
        <div
          onClick={() => onNavigate('pengaturan')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Jumlah Kelas</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {classes.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Rombel terdaftar</p>
        </div>

        {/* Card 3: Jadwal Hari Ini */}
        <div
          onClick={() => onNavigate('jadwal')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Jadwal Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {todaySchedules.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hari {todayDayName}</p>
        </div>

        {/* Card 4: Kehadiran Hari Ini */}
        <div
          onClick={() => onNavigate('absensi')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Kehadiran Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {attendanceRateToday !== null ? `${attendanceRateToday}%` : '-'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {todayAttendance.length > 0
              ? `${totalAttendedToday} dari ${todayAttendance.length} hadir`
              : 'Belum diisi'}
          </p>
        </div>

        {/* Card 5: Jurnal Mengajar */}
        <div
          onClick={() => onNavigate('jurnal')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Jurnal Mengajar</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {journals.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Catatan pertemuan</p>
        </div>

        {/* Card 6: Pendampingan Murid */}
        <div
          onClick={() => onNavigate('pendampingan')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Pendampingan</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {mentoringJournals.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMentoring.length} dalam pemantauan
          </p>
        </div>
      </div>

      {/* Two Column Grid: Today's Schedule & Quick Action / Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Teaching Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Jadwal Mengajar Hari Ini ({todayDayName})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('jadwal')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
            >
              Lihat Seluruh Jadwal
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaySchedules.length > 0 ? (
            <div className="space-y-2.5">
              {todaySchedules.map((sch) => {
                const cls = classes.find((c) => c.id === sch.classId);
                return (
                  <div
                    key={sch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-700 dark:text-slate-200 font-mono text-xs font-bold shrink-0">
                        <span>Jam</span>
                        <span className="text-blue-600 dark:text-blue-400">{sch.periodStart}-{sch.periodEnd}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded">
                            {cls?.name || sch.classId}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {sch.subject}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Ruang: <span className="font-medium text-slate-700 dark:text-slate-300">{sch.room || '-'}</span> · {sch.notes || 'Pembelajaran tatap muka'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                        {sch.startTime} - {sch.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('absensi')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                      >
                        Absen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 space-y-2">
              <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs">
                Tidak ada jam tatap muka terjadwal untuk hari <span className="font-semibold text-slate-700 dark:text-slate-200">{todayDayName}</span>.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('jadwal')}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-block mt-1"
              >
                + Tambah atau atur jadwal
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Access & Google Sheets Status */}
        <div className="space-y-4">
          {/* Quick Access Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Akses Cepat Administrasi
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('nilai_pengetahuan')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Penilaian Pengetahuan & Tugas
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('nilai_keterampilan')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Penilaian Praktik & Keterampilan
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pendampingan')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Catat Jurnal Pendampingan Siswa
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rekap_nilai')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Rekapan Nilai & Cetak Raport
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Cloud Storage Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Penyimpanan Spreadsheet</h3>
              {settings.appsScriptUrl ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {settings.appsScriptUrl
                ? 'Semua data otomatis tersimpan permanen di Google Spreadsheet Anda.'
                : 'Aplikasi saat ini beroperasi dengan memori lokal peramban. Anda dapat menghubungkan Google Spreadsheet kapan saja di menu Pengaturan.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('pengaturan')}
              className="w-full text-center py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.appsScriptUrl ? 'Kelola Integrasi Sheets' : 'Sambungkan Google Sheets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
