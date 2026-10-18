import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  GraduationCap,
  Award,
  HeartHandshake,
  Users,
} from 'lucide-react';
import {
  Student,
  ClassItem,
  KnowledgeAssessment,
  SkillAssessment,
  AttitudeAssessment,
  AppSettings,
} from '../../types';

interface GradesRecapViewProps {
  students: Student[];
  classes: ClassItem[];
  knowledgeAssessments: KnowledgeAssessment[];
  skillAssessments: SkillAssessment[];
  attitudeAssessments: AttitudeAssessment[];
  settings: AppSettings;
}

export const GradesRecapView: React.FC<GradesRecapViewProps> = ({
  students,
  classes,
  knowledgeAssessments,
  skillAssessments,
  attitudeAssessments,
  settings,
}) => {
  // Tab State
  const [activeTab, setActiveTab] = useState<'pengetahuan' | 'keterampilan' | 'sikap'>('pengetahuan');

  // Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [academicYear, setAcademicYear] = useState<string>(settings.academicYear);
  const [semester, setSemester] = useState<string>(settings.semester);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const activeClass = classes.find((c) => c.id === selectedClassId);

  // Filter students
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // Extract distinct topics
  const knowledgeTopics = useMemo(() => {
    const set = new Set<string>();
    knowledgeAssessments
      .filter((k) => k.classId === selectedClassId)
      .forEach((k) => set.add(k.topic));
    return Array.from(set);
  }, [knowledgeAssessments, selectedClassId]);

  const skillTopics = useMemo(() => {
    const set = new Set<string>();
    skillAssessments
      .filter((s) => s.classId === selectedClassId)
      .forEach((s) => set.add(s.topic));
    return Array.from(set);
  }, [skillAssessments, selectedClassId]);

  // Knowledge Aggregation
  const knowledgeRecapData = useMemo(() => {
    return classStudents.map((st) => {
      const records = knowledgeAssessments.filter(
        (k) =>
          k.classId === selectedClassId &&
          k.studentId === st.id &&
          (!academicYear || k.academicYear === academicYear) &&
          (!semester || k.semester === semester) &&
          (selectedTopic === 'all' || k.topic === selectedTopic)
      );

      const scores = records.map((r) => r.score);
      const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

      // Group by assessment type for columns
      const formatif = records.filter((r) => r.assessmentType === 'Formatif').map((r) => r.score);
      const sumatif = records.filter((r) => r.assessmentType === 'Sumatif').map((r) => r.score);
      const tugas = records.filter((r) => r.assessmentType === 'Tugas').map((r) => r.score);

      const avgFormatif = formatif.length > 0 ? Math.round(formatif.reduce((a, b) => a + b, 0) / formatif.length) : '-';
      const avgSumatif = sumatif.length > 0 ? Math.round(sumatif.reduce((a, b) => a + b, 0) / sumatif.length) : '-';
      const avgTugas = tugas.length > 0 ? Math.round(tugas.reduce((a, b) => a + b, 0) / tugas.length) : '-';

      return {
        student: st,
        recordsCount: records.length,
        avgFormatif,
        avgSumatif,
        avgTugas,
        finalAverage: avg !== null ? avg : '-',
        predicate: avg !== null ? (avg >= 88 ? 'A' : avg >= 78 ? 'B' : avg >= 68 ? 'C' : 'D') : '-',
      };
    });
  }, [classStudents, knowledgeAssessments, selectedClassId, academicYear, semester, selectedTopic]);

  // Skill Aggregation
  const skillRecapData = useMemo(() => {
    return classStudents.map((st) => {
      const records = skillAssessments.filter(
        (s) =>
          s.classId === selectedClassId &&
          s.studentId === st.id &&
          (!academicYear || s.academicYear === academicYear) &&
          (!semester || s.semester === semester) &&
          (selectedTopic === 'all' || s.topic === selectedTopic)
      );

      const scores = records.map((r) => r.finalScore);
      const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

      return {
        student: st,
        recordsCount: records.length,
        finalAverage: avg !== null ? avg : '-',
        predicate: avg !== null ? (avg >= 88 ? 'A' : avg >= 78 ? 'B' : avg >= 68 ? 'C' : 'D') : '-',
        recentFeedback: records[records.length - 1]?.feedback || '-',
      };
    });
  }, [classStudents, skillAssessments, selectedClassId, academicYear, semester, selectedTopic]);

  // Attitude Aggregation
  const attitudeRecapData = useMemo(() => {
    return classStudents.map((st) => {
      const records = attitudeAssessments.filter(
        (a) =>
          a.classId === selectedClassId &&
          a.studentId === st.id &&
          (!academicYear || a.academicYear === academicYear) &&
          (!semester || a.semester === semester)
      );

      let avgDis = 0;
      let avgResp = 0;
      let avgCoop = 0;
      let avgSport = 0;
      let avgConf = 0;

      if (records.length > 0) {
        records.forEach((r) => {
          avgDis += r.scores.discipline || 3;
          avgResp += r.scores.responsibility || 3;
          avgCoop += r.scores.cooperation || 3;
          avgSport += r.scores.sportsmanship || 3;
          avgConf += r.scores.confidence || 3;
        });

        const len = records.length;
        avgDis = Math.round((avgDis / len) * 10) / 10;
        avgResp = Math.round((avgResp / len) * 10) / 10;
        avgCoop = Math.round((avgCoop / len) * 10) / 10;
        avgSport = Math.round((avgSport / len) * 10) / 10;
        avgConf = Math.round((avgConf / len) * 10) / 10;
      }

      const totalScore = (avgDis + avgResp + avgCoop + avgSport + avgConf) / 5;
      const category =
        records.length === 0
          ? 'Belum Dinilai'
          : totalScore >= 3.5
          ? 'Sangat Berkembang (SB)'
          : totalScore >= 2.6
          ? 'Berkembang Sesuai Harapan (BSH)'
          : totalScore >= 1.8
          ? 'Mulai Berkembang (MB)'
          : 'Perlu Bimbingan (PB)';

      const notes = records[records.length - 1]?.behaviorNotes || '-';

      return {
        student: st,
        recordsCount: records.length,
        avgDis: records.length > 0 ? avgDis : '-',
        avgResp: records.length > 0 ? avgResp : '-',
        avgCoop: records.length > 0 ? avgCoop : '-',
        avgSport: records.length > 0 ? avgSport : '-',
        avgConf: records.length > 0 ? avgConf : '-',
        category,
        notes,
      };
    });
  }, [classStudents, attitudeAssessments, selectedClassId, academicYear, semester]);

  // Export CSV
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let title = '';

    if (activeTab === 'pengetahuan') {
      title = `REKAPAN NILAI PENGETAHUAN KELAS ${activeClass?.name}`;
      headers = ['No', 'NIS', 'Nama Murid', 'Rata Formatif', 'Rata Sumatif', 'Rata Tugas', 'Nilai Akhir', 'Predikat'];
      rows = knowledgeRecapData.map((d, i) => [
        i + 1,
        `"${d.student.nis}"`,
        `"${d.student.name}"`,
        d.avgFormatif,
        d.avgSumatif,
        d.avgTugas,
        d.finalAverage,
        d.predicate,
      ]);
    } else if (activeTab === 'keterampilan') {
      title = `REKAPAN NILAI KETERAMPILAN KELAS ${activeClass?.name}`;
      headers = ['No', 'NIS', 'Nama Murid', 'Jumlah Asesmen', 'Nilai Akhir (0-100)', 'Predikat', 'Catatan/Feedback'];
      rows = skillRecapData.map((d, i) => [
        i + 1,
        `"${d.student.nis}"`,
        `"${d.student.name}"`,
        d.recordsCount,
        d.finalAverage,
        d.predicate,
        `"${d.recentFeedback.replace(/"/g, '""')}"`,
      ]);
    } else {
      title = `REKAPAN NILAI SIKAP KELAS ${activeClass?.name}`;
      headers = ['No', 'NIS', 'Nama Murid', 'Disiplin', 'Tanggung Jawab', 'Kerja Sama', 'Sportivitas', 'Percaya Diri', 'Kategori Sikap', 'Catatan Perilaku'];
      rows = attitudeRecapData.map((d, i) => [
        i + 1,
        `"${d.student.nis}"`,
        `"${d.student.name}"`,
        d.avgDis,
        d.avgResp,
        d.avgCoop,
        d.avgSport,
        d.avgConf,
        `"${d.category}"`,
        `"${d.notes.replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [`"${title}"`, `"Tahun Ajaran: ${academicYear} (${semester})"`, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_${activeTab}_${activeClass?.name}_${academicYear}.csv`);
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
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Rekapan Nilai Murid
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kompilasi nilai akhir pengetahuan, keterampilan, dan sikap tanpa memodifikasi data mentah tersimpan.
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl max-w-fit no-print">
        <button
          type="button"
          onClick={() => setActiveTab('pengetahuan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'pengetahuan'
              ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Rekap Pengetahuan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('keterampilan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'keterampilan'
              ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Rekap Keterampilan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sikap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'sikap'
              ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Rekap Sikap
        </button>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Filter Materi</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Semua Materi (Rata-rata Semester)</option>
              {(activeTab === 'pengetahuan' ? knowledgeTopics : skillTopics).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
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
            LEMBAR REKAPITULASI NILAI{' '}
            {activeTab === 'pengetahuan'
              ? 'PENGETAHUAN'
              : activeTab === 'keterampilan'
              ? 'KETERAMPILAN'
              : 'SIKAP & KARAKTER'}
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap justify-center gap-3">
            <span>
              Guru: <strong className="text-slate-900 dark:text-white">{settings.teacherName}</strong>
            </span>
            <span>·</span>
            <span>
              Mata Pelajaran: <strong className="text-slate-900 dark:text-white">{settings.subject}</strong>
            </span>
            <span>·</span>
            <span>
              Kelas: <strong className="text-slate-900 dark:text-white">{activeClass?.name}</strong>
            </span>
            <span>·</span>
            <span>
              TA: <strong className="text-slate-900 dark:text-white">{academicYear}</strong> ({semester})
            </span>
          </div>
        </div>

        {/* Tab 1: Knowledge Recap Table */}
        {activeTab === 'pengetahuan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-y border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-700">No</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700">NIS</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Nama Murid</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">Formatif</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">Sumatif</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">Tugas</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/30">Nilai Akhir</th>
                  <th className="py-2.5 px-3 text-center w-20">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {knowledgeRecapData.map((d, idx) => (
                  <tr key={d.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {d.student.nis}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                      {d.student.name}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                      {d.avgFormatif}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                      {d.avgSumatif}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                      {d.avgTugas}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-sm text-blue-950 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                      {d.finalAverage}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        d.predicate === 'A' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                        d.predicate === 'B' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' :
                        d.predicate === 'C' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {d.predicate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Skill Recap Table */}
        {activeTab === 'keterampilan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-y border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-700">No</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700">NIS</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Nama Murid</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 dark:border-slate-700">Jml Praktik</th>
                  <th className="py-2.5 px-3 text-center w-32 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/30">Nilai Akhir (0-100)</th>
                  <th className="py-2.5 px-3 text-center w-20 border-r border-slate-200 dark:border-slate-700">Predikat</th>
                  <th className="py-2.5 px-3">Umpan Balik Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {skillRecapData.map((d, idx) => (
                  <tr key={d.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {d.student.nis}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                      {d.student.name}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                      {d.recordsCount}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-sm text-blue-950 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-700 tabular-nums">
                      {d.finalAverage}
                    </td>
                    <td className="py-2 px-3 text-center font-bold border-r border-slate-200 dark:border-slate-700">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        d.predicate === 'A' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                        d.predicate === 'B' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' :
                        d.predicate === 'C' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {d.predicate}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 italic">
                      {d.recentFeedback}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Attitude Recap Table */}
        {activeTab === 'sikap' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-y border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-700">No</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700">NIS</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Nama Murid</th>
                  <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">Disiplin</th>
                  <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">T.Jawab</th>
                  <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">Kerjasama</th>
                  <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">Sportif</th>
                  <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">P.Diri</th>
                  <th className="py-2.5 px-3 text-center w-36 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/30">Kategori</th>
                  <th className="py-2.5 px-3">Catatan Observasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attitudeRecapData.map((d, idx) => (
                  <tr key={d.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500 tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums border-r border-slate-200 dark:border-slate-700">
                      {d.student.nis}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                      {d.student.name}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-200 dark:border-slate-700 tabular-nums text-slate-700 dark:text-slate-300">
                      {d.avgDis}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-200 dark:border-slate-700 tabular-nums text-slate-700 dark:text-slate-300">
                      {d.avgResp}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-200 dark:border-slate-700 tabular-nums text-slate-700 dark:text-slate-300">
                      {d.avgCoop}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-200 dark:border-slate-700 tabular-nums text-slate-700 dark:text-slate-300">
                      {d.avgSport}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-slate-200 dark:border-slate-700 tabular-nums text-slate-700 dark:text-slate-300">
                      {d.avgConf}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {d.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
