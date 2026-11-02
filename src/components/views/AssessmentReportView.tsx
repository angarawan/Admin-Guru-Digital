import React, { useState, useMemo } from 'react';
import {
  Award,
  Printer,
  Download,
  Filter,
  Users,
  GraduationCap,
  HeartHandshake,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  School,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  KnowledgeAssessment,
  SkillAssessment,
  AttitudeAssessment,
  AppSettings,
} from '../../types';

interface AssessmentReportViewProps {
  students: Student[];
  classes: ClassItem[];
  knowledgeAssessments: KnowledgeAssessment[];
  skillAssessments: SkillAssessment[];
  attitudeAssessments: AttitudeAssessment[];
  settings: AppSettings;
}

type AssessmentTab = 'leger' | 'pengetahuan' | 'keterampilan' | 'sikap' | 'pengesahan';

export const AssessmentReportView: React.FC<AssessmentReportViewProps> = ({
  students,
  classes,
  knowledgeAssessments,
  skillAssessments,
  attitudeAssessments,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('leger');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'all');
  const [selectedSemester, setSelectedSemester] = useState<string>(settings.semester || 'Ganjil');
  const [kktpScore, setKktpScore] = useState<number>(75);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Filter assessments
  const filteredKnowledge = useMemo(() => {
    return knowledgeAssessments.filter((k) => {
      const matchClass = selectedClassId === 'all' || k.classId === selectedClassId;
      const matchSem = !k.semester || k.semester === selectedSemester;
      return matchClass && matchSem;
    });
  }, [knowledgeAssessments, selectedClassId, selectedSemester]);

  const filteredSkills = useMemo(() => {
    return skillAssessments.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchSem = !s.semester || s.semester === selectedSemester;
      return matchClass && matchSem;
    });
  }, [skillAssessments, selectedClassId, selectedSemester]);

  const filteredAttitudes = useMemo(() => {
    return attitudeAssessments.filter((a) => {
      const matchClass = selectedClassId === 'all' || a.classId === selectedClassId;
      const matchSem = !a.semester || a.semester === selectedSemester;
      return matchClass && matchSem;
    });
  }, [attitudeAssessments, selectedClassId, selectedSemester]);

  // Compute final student grades
  const studentGrades = useMemo(() => {
    return filteredStudents.map((st) => {
      // Pengetahuan
      const stKnow = filteredKnowledge.filter((k) => k.studentId === st.id);
      const knowAvg =
        stKnow.length > 0
          ? Math.round(stKnow.reduce((acc, cur) => acc + (cur.score || 0), 0) / stKnow.length)
          : 0;

      // Keterampilan
      const stSkill = filteredSkills.filter((s) => s.studentId === st.id);
      const skillAvg =
        stSkill.length > 0
          ? Math.round(stSkill.reduce((acc, cur) => acc + (cur.finalScore || 0), 0) / stSkill.length)
          : 0;

      // Sikap
      const stAtt = filteredAttitudes.filter((a) => a.studentId === st.id);
      const attAvg =
        stAtt.length > 0
          ? Math.round(
              stAtt.reduce((acc, cur) => {
                const s = cur.scores || {};
                const vals = [
                  s.discipline || 3,
                  s.responsibility || 3,
                  s.cooperation || 3,
                  s.sportsmanship || 3,
                  s.confidence || 3,
                ];
                const avg4 = vals.reduce((a, b) => a + b, 0) / vals.length;
                return acc + (avg4 / 4) * 100;
              }, 0) / stAtt.length
            )
          : 0;

      // Nilai Akhir PJOK (40% Keterampilan praktik, 30% Pengetahuan, 30% Sikap sportivitas jika lengkap, atau rerata aktif)
      let finalScore = 0;
      const activeScores = [];
      if (skillAvg > 0) activeScores.push({ val: skillAvg, weight: 0.4 });
      if (knowAvg > 0) activeScores.push({ val: knowAvg, weight: 0.3 });
      if (attAvg > 0) activeScores.push({ val: attAvg, weight: 0.3 });

      if (activeScores.length > 0) {
        const totalWeight = activeScores.reduce((acc, cur) => acc + cur.weight, 0);
        const weightedSum = activeScores.reduce((acc, cur) => acc + cur.val * cur.weight, 0);
        finalScore = Math.round(weightedSum / totalWeight);
      }

      // Predikat
      let predicate = 'D';
      if (finalScore >= 90) predicate = 'A';
      else if (finalScore >= 80) predicate = 'B';
      else if (finalScore >= kktpScore) predicate = 'C';

      const isPassed = finalScore >= kktpScore;

      // Deskripsi Capaian PJOK
      let description = '';
      if (finalScore >= 90) {
        description =
          'Sangat mahir dan konsisten dalam mempraktikkan keterampilan gerak, menguasai strategi taktik olahraga, serta menunjukkan sportivitas dan kerjasama yang luar biasa.';
      } else if (finalScore >= 80) {
        description =
          'Mampu mempraktikkan keterampilan gerak dasar dan kombinasi dengan baik, memahami konsep kebugaran jasmani, dan aktif bekerjasama dalam tim.';
      } else if (finalScore >= kktpScore) {
        description =
          'Cukup menguasai teknik dasar olahraga dan memahami konsep kesehatan jasmani, perlu sedikit peningkatan konsistensi dan kelenturan gerak.';
      } else if (finalScore > 0) {
        description =
          'Perlu bimbingan dan pendampingan remedial dalam penguasaan teknik dasar praktik lapangan serta peningkatan motivasi kebugaran jasmani.';
      } else {
        description = 'Belum ada penilaian yang tercatat pada semester ini.';
      }

      return {
        ...st,
        knowledgeAvg: knowAvg,
        skillAvg: skillAvg,
        attitudeAvg: attAvg,
        finalScore: finalScore,
        predicate: predicate,
        isPassed: isPassed,
        description: description,
      };
    });
  }, [filteredStudents, filteredKnowledge, filteredSkills, filteredAttitudes, kktpScore]);

  // Statistics
  const stats = useMemo(() => {
    const validScores = studentGrades.map((s) => s.finalScore).filter((v) => v > 0);
    if (validScores.length === 0) {
      return { avg: 0, highest: 0, lowest: 0, passedPercent: 0, passedCount: 0 };
    }
    const sum = validScores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / validScores.length);
    const highest = Math.max(...validScores);
    const lowest = Math.min(...validScores);
    const passedCount = studentGrades.filter((s) => s.isPassed && s.finalScore > 0).length;
    const passedPercent = Math.round((passedCount / validScores.length) * 100);

    return { avg, highest, lowest, passedPercent, passedCount };
  }, [studentGrades]);

  const selectedClassName =
    selectedClassId === 'all'
      ? 'Semua Kelas'
      : classes.find((c) => c.id === selectedClassId)?.name || 'Kelas';

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

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'NISN',
      'Nama Murid',
      'L/P',
      'Kelas',
      'Nilai Pengetahuan',
      'Nilai Keterampilan',
      'Nilai Sikap',
      'Nilai Akhir PJOK',
      'Predikat',
      'Status KKTP',
      'Deskripsi Capaian',
    ];

    const rows = studentGrades.map((s, idx) => [
      idx + 1,
      `'${s.nisn || s.nis || ''}`,
      `"${s.name}"`,
      s.gender,
      classes.find((c) => c.id === s.classId)?.name || '',
      s.knowledgeAvg,
      s.skillAvg,
      s.attitudeAvg,
      s.finalScore,
      s.predicate,
      s.isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
      `"${s.description}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Penilaian_PJOK_${selectedClassName.replace(/\s+/g, '_')}_Semester_${selectedSemester}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls (Hidden when printing) */}
      <div className="print:hidden space-y-4">
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white mb-2">
                <Award className="w-3.5 h-3.5" />
                Laporan Asesmen & Leger Rapor PJOK
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Laporan Penilaian Capaian Pembelajaran
              </h1>
              <p className="text-xs text-emerald-100 max-w-2xl mt-1 leading-relaxed">
                Rekapitulasi resmi nilai Pengetahuan, Keterampilan Praktik Olahraga, dan Sikap Sportivitas
                peserta didik dilengkapi predikat, status ketercapaian KKTP, dan lembar pengesahan tanda tangan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-md hover:bg-emerald-900 transition-all border border-emerald-500/50"
              >
                <Download className="w-4 h-4" />
                Ekspor Excel / CSV
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Pilih Kelas:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Kelas</option>
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
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Kriteria Ketuntasan (KKTP):
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={kktpScore}
                onChange={(e) => setKktpScore(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tanggal Pengesahan:
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { id: 'leger', label: '1. Rekap Nilai Akhir & Rapor (Leger)', icon: BarChart3 },
              { id: 'pengetahuan', label: `2. Penilaian Pengetahuan (${filteredKnowledge.length})`, icon: GraduationCap },
              { id: 'keterampilan', label: `3. Penilaian Keterampilan (${filteredSkills.length})`, icon: Award },
              { id: 'sikap', label: `4. Penilaian Sikap (${filteredAttitudes.length})`, icon: HeartHandshake },
              { id: 'pengesahan', label: '5. Lembar Pengesahan Nilai', icon: School },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as AssessmentTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
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

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Total Siswa</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {studentGrades.length} <span className="text-xs font-normal text-slate-500">murid</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">Rata-rata Kelas</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
              {stats.avg}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block">Nilai Tertinggi</span>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1 font-mono">
              {stats.highest}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">Nilai Terendah</span>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">
              {stats.lowest}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block">Ketuntasan KKTP</span>
            <div className="text-xl font-black text-teal-700 dark:text-teal-300 mt-1 font-mono">
              {stats.passedPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Printable Assessment Document Container */}
      <div className="bg-white text-slate-900 shadow-xl rounded-2xl p-6 sm:p-10 border border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none font-sans">
        {/* Official Kop Penilaian */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {settings.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt="Logo"
                  className="w-14 h-14 object-contain print:w-12 print:h-12"
                />
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 text-emerald-700 print:w-12 print:h-12">
                  <School className="w-7 h-7" />
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {settings.schoolName || 'SMA NEGERI / SWASTA INDONESIA'}
                </h3>
                <h1 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight">
                  LAPORAN PENILAIAN CAPAIAN PEMBELAJARAN (LEGER NILAI)
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Mata Pelajaran: {settings.subject || 'PJOK'} • Kelas: {selectedClassName} • Semester: {selectedSemester} • Tahun Ajaran: {settings.academicYear || '2024/2025'}
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] hidden sm:block border-l border-slate-300 pl-4">
              <div><strong>KKTP Satuan Pendidikan:</strong> {kktpScore}</div>
              <div><strong>Guru Pengampu:</strong> {settings.teacherName || '-'}</div>
              <div><strong>NIP:</strong> {settings.teacherNip || '-'}</div>
            </div>
          </div>
        </div>

        {/* ======================= TAB 1: REKAPITULASI NILAI AKHIR (LEGER) ======================= */}
        {(activeTab === 'leger' || activeTab === 'pengesahan') && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                LEGER NILAI RAPOR PJOK & KETERCAPAIAN KKTP
              </h2>
              <span className="text-xs font-bold text-slate-600">
                Kriteria Ketuntasan (KKTP): <span className="font-mono text-emerald-700">{kktpScore}</span>
              </span>
            </div>

            {studentGrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center">
                      <th className="border border-slate-800 px-2 py-2 w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 w-24">NISN</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Nama Murid</th>
                      <th className="border border-slate-800 px-2 py-2 w-10">L/P</th>
                      <th className="border border-slate-800 px-2 py-2 w-16">Kelas</th>
                      <th className="border border-slate-800 px-2 py-2 w-20 bg-amber-50 text-amber-900">
                        Pengetahuan<br />(30%)
                      </th>
                      <th className="border border-slate-800 px-2 py-2 w-20 bg-emerald-50 text-emerald-900">
                        Keterampilan<br />(40%)
                      </th>
                      <th className="border border-slate-800 px-2 py-2 w-20 bg-rose-50 text-rose-900">
                        Sikap<br />(30%)
                      </th>
                      <th className="border border-slate-800 px-2 py-2 w-16 bg-blue-100 text-blue-900 font-black">
                        Nilai Akhir
                      </th>
                      <th className="border border-slate-800 px-2 py-2 w-14">Predikat</th>
                      <th className="border border-slate-800 px-2 py-2 w-24">Status KKTP</th>
                      <th className="border border-slate-800 px-3 py-2 text-left w-64">
                        Deskripsi Capaian Kompetensi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGrades.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-800 px-2 py-2 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono text-[10px]">
                          {st.nisn || st.nis || '-'}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 font-bold text-slate-900">
                          {st.name}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-semibold">
                          {st.gender}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center">
                          {classes.find((c) => c.id === st.classId)?.name || '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono font-semibold">
                          {st.knowledgeAvg > 0 ? st.knowledgeAvg : '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono font-semibold">
                          {st.skillAvg > 0 ? st.skillAvg : '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono font-semibold">
                          {st.attitudeAvg > 0 ? st.attitudeAvg : '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono font-black text-sm bg-blue-50/50 text-blue-900">
                          {st.finalScore > 0 ? st.finalScore : '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-bold">
                          {st.finalScore > 0 ? st.predicate : '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-bold text-[10px]">
                          {st.finalScore > 0 ? (
                            st.isPassed ? (
                              <span className="text-emerald-800 font-bold">TUNTAS</span>
                            ) : (
                              <span className="text-rose-800 font-bold">BELUM TUNTAS</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-700 leading-relaxed text-[10px]">
                          {st.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-center">
                      <td colSpan={5} className="border border-slate-800 px-3 py-2 text-right">
                        RATA-RATA KELAS:
                      </td>
                      <td className="border border-slate-800 px-2 py-2 font-mono">
                        {Math.round(
                          studentGrades.reduce((a, b) => a + b.knowledgeAvg, 0) /
                            (studentGrades.filter((s) => s.knowledgeAvg > 0).length || 1)
                        ) || '-'}
                      </td>
                      <td className="border border-slate-800 px-2 py-2 font-mono">
                        {Math.round(
                          studentGrades.reduce((a, b) => a + b.skillAvg, 0) /
                            (studentGrades.filter((s) => s.skillAvg > 0).length || 1)
                        ) || '-'}
                      </td>
                      <td className="border border-slate-800 px-2 py-2 font-mono">
                        {Math.round(
                          studentGrades.reduce((a, b) => a + b.attitudeAvg, 0) /
                            (studentGrades.filter((s) => s.attitudeAvg > 0).length || 1)
                        ) || '-'}
                      </td>
                      <td className="border border-slate-800 px-2 py-2 font-mono font-black text-blue-900 bg-blue-100">
                        {stats.avg || '-'}
                      </td>
                      <td colSpan={3} className="border border-slate-800 px-3 py-2 text-left text-[10px]">
                        Tingkat Ketuntasan: <strong>{stats.passedPercent}%</strong> ({stats.passedCount} dari {studentGrades.length} murid)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data murid pada kelas ini.
              </div>
            )}
          </section>
        )}

        {/* ======================= TAB 2: RINCIAN PENGETAHUAN ======================= */}
        {activeTab === 'pengetahuan' && (
          <section className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3">
              DAFTAR NILAI ASESMEN PENGETAHUAN (KOGNITIF & FORMATIF)
            </h2>
            {filteredKnowledge.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center">
                      <th className="border border-slate-800 px-2 py-2 w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 w-24">Tanggal</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Nama Siswa</th>
                      <th className="border border-slate-800 px-2 py-2 w-16">Kelas</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Materi / Pokok Bahasan</th>
                      <th className="border border-slate-800 px-2 py-2 w-20">Jenis Asesmen</th>
                      <th className="border border-slate-800 px-2 py-2 w-16 font-mono font-black">Nilai</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKnowledge.map((k, idx) => (
                      <tr key={k.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-800 px-2 py-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center">{formatIndoDate(k.date)}</td>
                        <td className="border border-slate-800 px-3 py-1.5 font-bold text-slate-900">{k.studentName}</td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center">{classes.find((c) => c.id === k.classId)?.name || '-'}</td>
                        <td className="border border-slate-800 px-3 py-1.5 font-semibold text-slate-900">{k.topic}</td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center font-medium">{k.assessmentType || 'Tes Tertulis'}</td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-sm">{k.score}</td>
                        <td className="border border-slate-800 px-3 py-1.5 text-slate-700">{k.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data asesmen pengetahuan yang tersimpan.
              </div>
            )}
          </section>
        )}

        {/* ======================= TAB 3: RINCIAN KETERAMPILAN ======================= */}
        {activeTab === 'keterampilan' && (
          <section className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3">
              DAFTAR NILAI ASESMEN KETERAMPILAN (PRAKTIK UNJUK KERJA PJOK)
            </h2>
            {filteredSkills.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center">
                      <th className="border border-slate-800 px-2 py-2 w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 w-24">Tanggal</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Nama Siswa</th>
                      <th className="border border-slate-800 px-2 py-2 w-16">Kelas</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Keterampilan Gerak / Olahraga</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Indikator Kinerja</th>
                      <th className="border border-slate-800 px-2 py-2 w-16 font-mono font-black">Nilai</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Catatan Gerak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-800 px-2 py-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center">{formatIndoDate(s.date)}</td>
                        <td className="border border-slate-800 px-3 py-1.5 font-bold text-slate-900">{s.studentName}</td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center">{classes.find((c) => c.id === s.classId)?.name || '-'}</td>
                        <td className="border border-slate-800 px-3 py-1.5 font-semibold text-slate-900">{s.topic}</td>
                        <td className="border border-slate-800 px-3 py-1.5 text-slate-700">
                          {s.indicators && s.indicators.length > 0
                            ? s.indicators.map((i) => i.name).join(', ')
                            : s.practiceType || '-'}
                        </td>
                        <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-sm">{s.finalScore}</td>
                        <td className="border border-slate-800 px-3 py-1.5 text-slate-700">{s.notes || s.feedback || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data asesmen keterampilan yang tersimpan.
              </div>
            )}
          </section>
        )}

        {/* ======================= TAB 4: RINCIAN SIKAP ======================= */}
        {activeTab === 'sikap' && (
          <section className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3">
              DAFTAR NILAI ASESMEN SIKAP (SPORTIVITAS & PROFIL PELAJAR PANCASILA)
            </h2>
            {filteredAttitudes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center">
                      <th className="border border-slate-800 px-2 py-2 w-8">No</th>
                      <th className="border border-slate-800 px-2 py-2 w-24">Tanggal</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Nama Siswa</th>
                      <th className="border border-slate-800 px-2 py-2 w-16">Kelas</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Aspek Sikap / Nilai Karakter</th>
                      <th className="border border-slate-800 px-2 py-2 w-16 font-mono font-black">Nilai</th>
                      <th className="border border-slate-800 px-3 py-2 text-left">Catatan Pengamatan Guru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttitudes.map((a, idx) => {
                      const vals = [
                        a.scores.discipline || 3,
                        a.scores.responsibility || 3,
                        a.scores.cooperation || 3,
                        a.scores.sportsmanship || 3,
                        a.scores.confidence || 3,
                      ];
                      const attitudeScore = Math.round((vals.reduce((x, y) => x + y, 0) / 20) * 100);
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center">{formatIndoDate(a.date)}</td>
                          <td className="border border-slate-800 px-3 py-1.5 font-bold text-slate-900">{a.studentName}</td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center">{classes.find((c) => c.id === a.classId)?.name || '-'}</td>
                          <td className="border border-slate-800 px-3 py-1.5 font-semibold text-slate-900">
                            Disiplin, Tanggung Jawab, Kerjasama, Sportivitas, Percaya Diri
                          </td>
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono font-bold text-sm">
                            {attitudeScore}
                          </td>
                          <td className="border border-slate-800 px-3 py-1.5 text-slate-700">
                            {a.behaviorNotes || a.resultSummary || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Belum ada data asesmen sikap yang tersimpan.
              </div>
            )}
          </section>
        )}

        {/* ======================= TAB 5: LEMBAR PENGESAHAN NILAI ======================= */}
        {(activeTab === 'leger' || activeTab === 'pengesahan') && (
          <section className="pt-8 page-break-after">
            <div className="border-t-2 border-slate-900 pt-6">
              <div className="flex justify-between items-center text-xs text-slate-600 mb-8">
                <div>
                  Laporan penilaian ini sah digunakan sebagai dasar pengisian nilai rapor semester dan
                  evaluasi ketercapaian tujuan pembelajaran.
                </div>
                <div className="font-semibold text-slate-800">
                  Ditetapkan di: {settings.schoolName || 'Sekolah'}, {formatIndoDate(reportDate)}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 sm:gap-16 text-center text-xs">
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
                    <p className="font-semibold text-slate-700">Guru Pengampu,</p>
                    <p className="font-bold text-slate-900 uppercase">Mata Pelajaran PJOK</p>
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
