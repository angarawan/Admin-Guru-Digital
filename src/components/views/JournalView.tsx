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
  Check,
  ListOrdered,
  Sparkles,
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

// Preset Kata-kata Hasil Pembelajaran & Capaian (PJOK)
const PRESET_RESULTS = [
  '85% murid mampu mempraktikkan keterampilan gerak dasar dan variasi teknik secara benar dan bugar.',
  'Sebagian besar murid menunjukkan koordinasi gerak yang baik dan memahami strategi permainan secara sportif.',
  'Seluruh murid aktif berpartisipasi dalam pemanasan, materi inti olahraga, hingga tahap pendinginan dengan antusias.',
  'Murid mampu menganalisis kesalahan gerak teman dan memberikan umpan balik perbaikan secara konstruktif.',
  'Tuntas 100%, seluruh murid mencapai kriteria ketuntasan tujuan pembelajaran (KKTP) materi PJOK.',
  '75% murid telah menguasai teknik dengan sangat baik, 25% murid masih membutuhkan bimbingan kelenturan dan postur.',
  'Murid memahami pentingnya kebugaran jasmani dan menerapkan protokol keselamatan olahraga secara disiplin.',
  'Sikap sportivitas, kerjasama tim, dan saling menghargai terwujud sangat nyata dalam simulasi pertandingan.',
];

// Preset Kata-kata Refleksi Guru (PJOK)
const PRESET_REFLECTIONS = [
  'Alokasi waktu praktik dan pemanasan berjalan efektif, siswa sangat antusias dan bersemangat di lapangan.',
  'Manajemen ruang lapangan dan pembagian kelompok olahraga berjalan tertib, aman, dan kondusif.',
  'Metode demonstrasi visual dan praktik bertahap terbukti mempermudah siswa memahami rangkaian teknik gerak.',
  'Perlu penambahan variasi alat bantu agar siswa yang belum terbiasa bergerak dapat mencoba dengan percaya diri.',
  'Beberapa siswa mengalami kelelahan lebih awal, perlu penyesuaian intensitas latihan sirkuit secara bertahap.',
  'Instruksi aturan keselamatan olahraga berhasil dipatuhi seluruh siswa tanpa terjadi insiden cidera fisik.',
  'Model pembelajaran kooperatif berhasil memacu murid yang awalnya pasif menjadi aktif bergerak.',
  'Perlu memberikan motivasi dan ruang latihan khusus bagi siswi yang kurang percaya diri saat bermain bola besar.',
];

// Preset Kata-kata Tindak Lanjut Pembelajaran (PJOK)
const PRESET_FOLLOW_UPS = [
  'Melanjutkan ke materi teknik lanjutan dan simulasi pertandingan mini (mini tournament) pada pertemuan berikutnya.',
  'Memberikan pendampingan bimbingan khusus (remedial praktik teknik gerak) bagi siswa yang belum mencapai KKTP.',
  'Pengayaan: Memberikan peran kapten tim atau wasit mini bagi murid yang telah mahir untuk melatih kepemimpinan.',
  'Menugaskan latihan pembiasaan mandiri di rumah (kebugaran jasmani: push-up, sit-up, skipping) selama 15 menit/hari.',
  'Mempersiapkan asesmen praktik unjuk kerja dan penilaian pemahaman konsep olahraga pada pertemuan mendatang.',
  'Koordinasi dengan wali kelas dan guru BK mengenai kondisi fisik/kesehatan beberapa siswa tertentu.',
  'Evaluasi dan pengecekan kelayakan peralatan olahraga (bola, matras, cone pembatas) bersama petugas sarpras.',
];

// Preset Terpadu Kegiatan Pembelajaran PJOK (Pemanasan, Inti, Pendinginan) sesuai Materi
interface SportActivityPreset {
  category: string;
  topicName: string;
  pemanasan: string;
  inti: string;
  pendinginan: string;
}

const SPORT_ACTIVITY_PRESETS: Record<string, SportActivityPreset> = {
  'Sepak Bola / Futsal': {
    category: 'Sepak Bola / Futsal',
    topicName: 'Permainan Bola Besar (Sepak Bola / Futsal: Passing, Dribbling, & Taktik)',
    pemanasan: 'Jogging 2 putaran lapangan, peregangan dinamis sendi panggul dan lutut, dilanjutkan game rondo (kucing-kucingan bola) 1 sentuhan.',
    inti: 'Demonstrasi teknik passing dan stopping kaki bagian dalam/luar, drill operan berpasangan jarak 5-10m, latihan dribbling slalom cone, dan simulasi pertandingan 5 vs 5 modifikasi.',
    pendinginan: 'Pelemasan statis otot hamstring dan betis berpasangan, latihan pernapasan dalam diafragma, refleksi evaluasi strategi permainan, dan doa penutup.',
  },
  'Bola Voli': {
    category: 'Bola Voli',
    topicName: 'Permainan Bola Besar (Bola Voli: Passing Bawah, Passing Atas, & Servis)',
    pemanasan: 'Pemanasan dinamis bahu, lengan, dan pergelangan tangan, lempar tangkap bola voli melintasi net, dan peregangan statis terfokus.',
    inti: 'Latihan passing bawah dan atas berpasangan melintasi net, drill servis bawah/atas terarah ke sasaran lapangan lawan, dan mini game 3 vs 3 pola tiga sentuhan.',
    pendinginan: 'Peregangan otot punggung dan bahu, evaluasi ketepatan perkenaan bola, apresiasi kerjasama dan sportivitas regu, serta doa penutup.',
  },
  'Bola Basket': {
    category: 'Bola Basket',
    topicName: 'Permainan Bola Besar (Bola Basket: Chest Pass, Dribble, & Lay-up Shoot)',
    pemanasan: 'Dribbling dinamis keliling lapangan dengan aba-aba peluit, pemanasan statis pergelangan tangan dan engkel, serta mini tag game.',
    inti: 'Drill passing (chest pass, bounce pass, overhead pass) berpasangan, latihan dribbling zig-zag rintangan cone, praktik lay-up shoot langkah 1-2, dan simulasi game 3 on 3.',
    pendinginan: 'Pelemasan otot lengan dan tungkai, refleksi konsistensi akurasi shooting, apresiasi kepemimpinan kapten tim, dan doa penutup.',
  },
  'Bulu Tangkis': {
    category: 'Bulu Tangkis',
    topicName: 'Permainan Bola Kecil (Bulu Tangkis: Forehand/Backhand, Servis, & Pukulan Lob)',
    pemanasan: 'Latihan langkah kaki footwork cepat (shadow badminton 6 titik), peregangan dinamis lengan pemukul, serta reli ringan pemanasan net.',
    inti: 'Latihan variasi pegangan raket (forehand & backhand grip), teknik servis pendek/panjang, pukulan lob lambung tinggi dan drop shot, dilanjutkan simulasi reli poin tunggal.',
    pendinginan: 'Pelemasan pergelangan bahu dan kaki, review taktik pengembalian shuttlecock, penguatan etika bertanding, dan doa bersama.',
  },
  'Atletik (Lari & Lompat)': {
    category: 'Atletik (Lari & Lompat)',
    topicName: 'Atletik (Lari Cepat Sprint 100m, Start Jongkok, & Lompat Jauh)',
    pemanasan: 'Jogging santai mengitari lintasan, ABC running drills (high knees, butt kicks, ankling, bounding), dan peregangan dinamis otot paha/tungkai.',
    inti: 'Praktik teknik start jongkok aba-aba "bersedia, siap, ya", fase transisi akselerasi lari cepat sprint 60/100m, posisi badan condong, dan teknik masuk garis finis.',
    pendinginan: 'Jalan santai mengitari lintasan sambil menarik nafas teratur, peregangan relaksasi otot tungkai, evaluasi catatan waktu, dan doa penutup.',
  },
  'Kebugaran Jasmani': {
    category: 'Kebugaran Jasmani',
    topicName: 'Aktivitas Kebugaran Jasmani (Kekuatan, Daya Tahan, & Kelincahan)',
    pemanasan: 'Pemanasan dinamis kalistenik (jumping jacks, arm circles, lunges) untuk meningkatkan detak jantung ke zona latihan (training zone).',
    inti: 'Sirkuit training 4 pos (Pos 1: Push-up kekuatan otot lengan, Pos 2: Sit-up daya tahan otot perut, Pos 3: Shuttle run kelincahan gerak, Pos 4: Naik-turun bangku daya tahan kardiorespirasi).',
    pendinginan: 'Peregangan statis seluruh tubuh (full body stretch), pengukuran denyut nadi pemulihan (recovery heart rate), evaluasi indeks kebugaran, dan doa penutup.',
  },
  'Senam Lantai': {
    category: 'Senam Lantai',
    topicName: 'Senam Lantai (Guling Depan, Guling Belakang, & Keseimbangan Lilin)',
    pemanasan: 'Peregangan terfokus kelenturan sendi leher, pergelangan tangan, panggul, dan pinggang untuk keselamatan gerak senam di matras.',
    inti: 'Praktik bertahap gerak guling depan (forward roll) dan guling belakang (backward roll) di atas matras dengan instruksi keselamatan guru, serta variasi sikap lilin.',
    pendinginan: 'Pelemasan otot leher dan tulang belakang (child pose & cat-cow stretch), refleksi keberanian siswa dan evaluasi posisi mendarat, serta doa bersama.',
  },
  'Bela Diri (Pencak Silat)': {
    category: 'Bela Diri (Pencak Silat)',
    topicName: 'Bela Diri Pencak Silat (Kuda-kuda, Pola Langkah, Pukulan, & Tangkisan)',
    pemanasan: 'Pemanasan sendi tungkai, kelenturan panggul, peregangan dinamis ekstremitas, dan latihan pernapasan dasar jurus pencak silat.',
    inti: 'Latihan sikap pasang, variasi kuda-kuda (depan, tengah, samping), teknik pukulan lurus dan tebak, teknik tangkisan atas/bawah secara berpasangan terkontrol, dan peragaan jurus tunggal.',
    pendinginan: 'Latihan pernapasan penenang (recovery breathing), sikap penghormatan pesilat, penanaman nilai budi pekerti serta disiplin, dan doa penutup.',
  },
  'Permainan Tradisional & Kebugaran': {
    category: 'Permainan Tradisional & Kebugaran',
    topicName: 'Aktivitas Kebugaran melalui Permainan Tradisional Modifikasi (Kasti / Bentengan)',
    pemanasan: 'Pemanasan dinamis seluruh tubuh dengan permainan reaksi cepat visual dan auditori di lapangan terbuka.',
    inti: 'Praktik permainan tradisional modifikasi (bentengan / gobak sodor / kasti) yang melatih kelincahan, kecepatan lari, strategi regu, dan gotong royong.',
    pendinginan: 'Pelemasan otot tungkai dan lengan melingkar santai di tempat teduh, evaluasi kerjasama dan sportivitas permainan, serta doa penutup.',
  },
};

const GENERAL_PEMANASAN_OPTIONS = [
  'Jogging 2 putaran lapangan, pemanasan statis kepala hingga kaki, dan dinamis 2x8 hitungan.',
  'Permainan pemanasan rondo / bola kecil / tag game untuk aktivasi otot dan meningkatkan fokus.',
  'Peregangan dinamis sendi tungkai, panggul, bahu, dan akselerasi lari pendek bertahap.',
  'Pemanasan senam ritmik aerobik ringan untuk menaikkan denyut nadi ke zona latihan fisik.',
  'Latihan koordinasi kelincahan (ladder drill / ABC run) dan peregangan sendi terfokus.',
];

const GENERAL_PENDINGINAN_OPTIONS = [
  'Peregangan statis pemulihan, pelemasan otot tungkai dan pernapasan melingkar di tengah lapangan.',
  'Senam pendinginan (cooling down) perlambatan detak jantung, pelemasan otot bahu dan pinggang.',
  'Duduk rileks selonjor melingkar, evaluasi umpan balik gerak siswa, apresiasi performa, dan doa penutup.',
  'Latihan pernapasan dalam diafragma, hidrasi tubuh, dan refleksi singkat pembelajaran.',
  'Pelemasan otot berpasangan, pembersihan dan pengembalian sarana olahraga ke gudang, serta doa.',
];

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

  // Multi-Class selection state in form
  const [selectedFormClassIds, setSelectedFormClassIds] = useState<string[]>([]);
  const [selectedSportCategory, setSelectedSportCategory] = useState<string>('Sepak Bola / Futsal');

  // Keep selectedClassFilter synchronized
  useEffect(() => {
    if (selectedClassFilter !== 'all' && !classes.some((c) => c.id === selectedClassFilter)) {
      setSelectedClassFilter('all');
    }
  }, [classes, selectedClassFilter]);

  const [formData, setFormData] = useState<Partial<TeachingJournal>>({
    date: todayStr,
    day: dayNames[new Date().getDay()],
    classId: classes[0]?.id || '',
    subject: settings.subject || 'PJOK',
    periodStart: 1,
    periodEnd: 3,
    topic: '',
    activities: '',
    method: 'Praktik & Demonstrasi Lapangan',
    results: '',
    obstacles: '',
    reflection: '',
    followUp: '',
    driveLink: '',
    academicYear: settings.academicYear,
    semester: settings.semester,
  });

  const handleApplyFullSportActivities = (sportKey: string) => {
    const preset = SPORT_ACTIVITY_PRESETS[sportKey];
    if (!preset) return;
    const formatted = `1. Pemanasan: ${preset.pemanasan}\n2. Kegiatan Inti: ${preset.inti}\n3. Pendinginan: ${preset.pendinginan}`;
    setFormData((prev) => ({
      ...prev,
      activities: formatted,
      topic: prev.topic && prev.topic.trim() ? prev.topic : `1. ${preset.topicName}`,
    }));
  };

  const handleAppendActivityPhase = (phase: 'Pemanasan' | 'Kegiatan Inti' | 'Pendinginan', text: string) => {
    if (!text) return;
    setFormData((prev) => {
      const current = (prev.activities || '').trim();
      const phasePrefix = phase === 'Pemanasan' ? '1. Pemanasan:' : phase === 'Kegiatan Inti' ? '2. Kegiatan Inti:' : '3. Pendinginan:';
      if (!current) {
        return { ...prev, activities: `${phasePrefix} ${text}` };
      }
      return { ...prev, activities: `${current}\n${phasePrefix} ${text}` };
    });
  };

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
    setSelectedFormClassIds(classes[0] ? [classes[0].id] : []);
    setFormData({
      date: todayStr,
      day: dayNames[new Date().getDay()],
      classId: classes[0]?.id || '',
      subject: settings.subject || 'PJOK',
      periodStart: 1,
      periodEnd: 2,
      topic: '',
      activities: '',
      method: 'Praktik & Demonstrasi Lapangan',
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
    let initialClassIds: string[] = [];
    if (journal.classIds && journal.classIds.length > 0) {
      initialClassIds = [...journal.classIds];
    } else if (journal.classId) {
      initialClassIds = journal.classId.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (initialClassIds.length === 0 && classes[0]) {
      initialClassIds = [classes[0].id];
    }
    setSelectedFormClassIds(initialClassIds);
    setFormData({ ...journal });
    setIsModalOpen(true);
  };

  const openDetailModal = (journal: TeachingJournal) => {
    setActiveDetailJournal(journal);
    setIsDetailModalOpen(true);
  };

  // Toggle class selection for multi-class teaching in PJOK
  const handleToggleClass = (classId: string) => {
    setSelectedFormClassIds((prev) => {
      if (prev.includes(classId)) {
        if (prev.length === 1) {
          alert('Minimal 1 kelas harus dipilih untuk jurnal mengajar.');
          return prev;
        }
        return prev.filter((id) => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSelectAllClasses = () => {
    setSelectedFormClassIds(classes.map((c) => c.id));
  };

  const handleSelectOnlyFirstClass = () => {
    if (classes[0]) {
      setSelectedFormClassIds([classes[0].id]);
    }
  };

  // Automatic numbering on Enter in Materi Pembelajaran
  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      // Find start of current line
      const lastNewline = value.lastIndexOf('\n', selectionStart - 1);
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = value.substring(lineStart, selectionStart);

      // Match numbered list: e.g. "1. ", "  2. "
      const match = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);
      if (match) {
        e.preventDefault();
        const indent = match[1];
        const num = parseInt(match[2], 10);
        const textAfterNumber = match[3];

        // If line is empty after number (user pressed Enter on empty bullet e.g. "2. "), remove bullet
        if (textAfterNumber.trim() === '') {
          const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
          setFormData((prev) => ({ ...prev, topic: newValue }));
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
          return;
        }

        // Insert next number on new line
        const nextPrefix = `\n${indent}${num + 1}. `;
        const newValue = value.substring(0, selectionStart) + nextPrefix + value.substring(selectionEnd);
        setFormData((prev) => ({ ...prev, topic: newValue }));
        setTimeout(() => {
          const newCursor = selectionStart + nextPrefix.length;
          textarea.selectionStart = textarea.selectionEnd = newCursor;
        }, 0);
      }
    }
  };

  // Helper to append or set preset phrase
  const handleApplyPreset = (
    field: 'results' | 'reflection' | 'followUp',
    phrase: string
  ) => {
    if (!phrase) return;
    setFormData((prev) => {
      const current = (prev[field] || '').trim();
      if (!current) {
        return { ...prev, [field]: phrase };
      }
      return { ...prev, [field]: `${current}\n• ${phrase}` };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFormClassIds.length === 0) {
      alert('Mohon pilih minimal 1 kelas.');
      return;
    }
    if (!formData.topic || !formData.topic.trim()) {
      alert('Mohon isi materi/pokok bahasan pembelajaran.');
      return;
    }

    const selectedNames = selectedFormClassIds
      .map((id) => classes.find((c) => c.id === id)?.name || id)
      .join(', ');

    const journal: TeachingJournal = {
      id: editingJournal ? editingJournal.id : `jr-${Date.now()}`,
      date: formData.date || todayStr,
      day: formData.day || 'Senin',
      classId: selectedFormClassIds.join(', '),
      classIds: selectedFormClassIds,
      className: selectedNames,
      subject: formData.subject || settings.subject,
      periodStart: Number(formData.periodStart) || 1,
      periodEnd: Number(formData.periodEnd) || 2,
      topic: formData.topic.trim(),
      activities: formData.activities || '',
      method: formData.method || 'Praktik & Demonstrasi Lapangan',
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

  // Class names resolver for any journal
  const getJournalClassNames = (jr: TeachingJournal): string[] => {
    if (jr.className && jr.className.trim()) {
      return jr.className.split(',').map((s) => s.trim());
    }
    if (jr.classIds && jr.classIds.length > 0) {
      return jr.classIds.map((id) => classes.find((c) => c.id === id)?.name || id);
    }
    if (jr.classId) {
      return jr.classId.split(',').map((s) => {
        const trimmed = s.trim();
        return classes.find((c) => c.id === trimmed)?.name || trimmed;
      });
    }
    return [];
  };

  const filteredJournals = journals.filter((j) => {
    let matchClass = true;
    if (selectedClassFilter !== 'all') {
      const targetCls = classes.find((c) => c.id === selectedClassFilter);
      const targetName = targetCls?.name.toLowerCase();

      const inClassIds = j.classIds && j.classIds.includes(selectedClassFilter);
      const inClassIdStr = j.classId && j.classId.includes(selectedClassFilter);
      const inClassName = targetName && j.className && j.className.toLowerCase().includes(targetName);

      matchClass = Boolean(inClassIds || inClassIdStr || inClassName);
    }
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
            Dokumentasi pembelajaran, multi-kelas PJOK, capaian hasil belajar, refleksi guru, dan tindak lanjut.
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
            placeholder="Cari materi, kegiatan, metode..."
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
            const classNames = getJournalClassNames(jr);
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

                    {/* Multi-Class Badges */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {classNames.length > 0 ? (
                        classNames.map((name, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded">
                          {jr.classId}
                        </span>
                      )}
                    </div>

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

                {/* Materi Pembelajaran */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Materi Pembelajaran:
                  </h4>
                  <div className="text-sm font-bold text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                    {jr.topic}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">Metode Pembelajaran:</span>
                    <span>{jr.method || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">Hasil & Capaian:</span>
                    <span className="line-clamp-2">{jr.results || '-'}</span>
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
          {/* Tanggal & Hari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {/* Multi-Class Selection (PJOK Multi-Kelas) */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold text-blue-950 dark:text-blue-200">
                  Pilih Kelas Pembelajaran (Bisa Lebih Dari 1 Kelas) *
                </label>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Untuk pembelajaran PJOK yang menggabungkan beberapa rombel atau mengajar lebih dari 1 kelas dalam 1 sesi:
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleSelectOnlyFirstClass}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Reset 1 Kelas
                </button>
              </div>
            </div>

            {/* Checkbox Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {classes.map((cls) => {
                const isSelected = selectedFormClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleToggleClass(cls.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                        isSelected ? 'bg-white text-blue-600' : 'border border-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{cls.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 pt-0.5">
              Terpilih: <strong className="text-blue-700 dark:text-blue-300">{selectedFormClassIds.length} kelas</strong> (
              {selectedFormClassIds.map((id) => classes.find((c) => c.id === id)?.name || id).join(', ') || 'Belum ada kelas'}
              )
            </div>
          </div>

          {/* Mapel & Jam Ke- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={formData.subject || settings.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 font-medium"
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

          {/* Materi Pembelajaran with Auto-Numbering on Enter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Materi Pembelajaran (Penomoran Otomatis Saat Enter) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => {
                    const current = prev.topic || '';
                    if (!current.trim()) return { ...prev, topic: '1. ' };
                    return { ...prev, topic: current + '\n1. ' };
                  });
                }}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                title="Mulai baris berpenomoran 1."
              >
                <ListOrdered className="w-3.5 h-3.5" />
                + Mulai Nomor 1.
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={formData.topic || ''}
              onKeyDown={handleTopicKeyDown}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Ketik materi di sini. Contoh:&#10;1. Permainan Bola Besar (Sepak Bola: Passing dan Dribbling)&#10;2. Latihan Kelincahan dan Daya Tahan Jasmani&#10;(Tekan Enter otomatis membuat nomor berikutnya...)"
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium dark:placeholder-slate-500 leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Tips: Ketika baris diawali nomor (misal 1.), menekan <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-mono">Enter</kbd> otomatis menyisipkan nomor berikutnya (2., 3., dst).
            </p>
          </div>

          {/* Metode & Tautan Google Drive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode / Model Pembelajaran
              </label>
              <input
                type="text"
                value={formData.method || ''}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                placeholder="Contoh: Praktik Lapangan, Demonstrasi, Game Turnamen"
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

          {/* Kegiatan Pembelajaran (Pemanasan, Inti, Pendinginan) with Dropdowns matched to Sports/Topics */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Kegiatan Pembelajaran (Pemanasan, Inti, Pendinginan)
              </label>
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                Pilih materi olahraga di bawah untuk otomatisasi
              </span>
            </div>

            {/* Selector Kategori Olahraga / Materi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900/40">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  1. Pilih Topik Materi PJOK:
                </label>
                <select
                  value={selectedSportCategory}
                  onChange={(e) => setSelectedSportCategory(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(SPORT_ACTIVITY_PRESETS).map((key) => (
                    <option key={key} value={key}>
                      ⚽ {key}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleApplyFullSportActivities(selectedSportCategory)}
                  className="w-full text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  title="Otomatis isi Pemanasan, Inti, dan Pendinginan sesuai materi ini"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Terapkan 1 Paket Lengkap
                </button>
              </div>
            </div>

            {/* Dropdown 3 Fase: Pemanasan, Inti, Pendinginan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-0.5">
              {/* Dropdown Pemanasan */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  🔥 Fase Pemanasan:
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    handleAppendActivityPhase('Pemanasan', e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full text-[11px] px-2 py-1.5 border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="" disabled>
                    ▼ Sisipkan Pemanasan...
                  </option>
                  {SPORT_ACTIVITY_PRESETS[selectedSportCategory] && (
                    <option value={SPORT_ACTIVITY_PRESETS[selectedSportCategory].pemanasan}>
                      [Sesuai {selectedSportCategory}] {SPORT_ACTIVITY_PRESETS[selectedSportCategory].pemanasan.slice(0, 48)}...
                    </option>
                  )}
                  {GENERAL_PEMANASAN_OPTIONS.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt.slice(0, 52)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Kegiatan Inti */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  ⚡ Fase Kegiatan Inti:
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    handleAppendActivityPhase('Kegiatan Inti', e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full text-[11px] px-2 py-1.5 border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="" disabled>
                    ▼ Sisipkan Kegiatan Inti...
                  </option>
                  {SPORT_ACTIVITY_PRESETS[selectedSportCategory] && (
                    <option value={SPORT_ACTIVITY_PRESETS[selectedSportCategory].inti}>
                      [Sesuai {selectedSportCategory}] {SPORT_ACTIVITY_PRESETS[selectedSportCategory].inti.slice(0, 48)}...
                    </option>
                  )}
                  {Object.entries(SPORT_ACTIVITY_PRESETS)
                    .filter(([k]) => k !== selectedSportCategory)
                    .map(([k, v]) => (
                      <option key={k} value={v.inti}>
                        [{k}] {v.inti.slice(0, 48)}...
                      </option>
                    ))}
                </select>
              </div>

              {/* Dropdown Pendinginan */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                  ❄️ Fase Pendinginan:
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    handleAppendActivityPhase('Pendinginan', e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full text-[11px] px-2 py-1.5 border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-200 rounded-md focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="" disabled>
                    ▼ Sisipkan Pendinginan...
                  </option>
                  {SPORT_ACTIVITY_PRESETS[selectedSportCategory] && (
                    <option value={SPORT_ACTIVITY_PRESETS[selectedSportCategory].pendinginan}>
                      [Sesuai {selectedSportCategory}] {SPORT_ACTIVITY_PRESETS[selectedSportCategory].pendinginan.slice(0, 48)}...
                    </option>
                  )}
                  {GENERAL_PENDINGINAN_OPTIONS.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt.slice(0, 52)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Textarea kegiatan pembelajaran yang dapat diedit langsung */}
            <div>
              <textarea
                rows={4}
                value={formData.activities || ''}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                placeholder="Rangkaian kegiatan pembelajaran (1. Pemanasan, 2. Kegiatan Inti, 3. Pendinginan)..."
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 leading-relaxed font-sans"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Tips: Klik <strong>&apos;Terapkan 1 Paket Lengkap&apos;</strong> untuk langsung mengisi 3 tahap secara terstruktur, atau pilih dropdown masing-masing fase untuk menyisipkan teks.
              </p>
            </div>
          </div>

          {/* Hasil Pembelajaran & Capaian (Dropdown Preset + Textarea) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Hasil Pembelajaran & Capaian
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilih dari dropdown atau ketik mandiri</span>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleApplyPreset('results', e.target.value);
                  e.target.value = '';
                }}
                className="w-full text-xs px-2.5 py-1.5 border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="" disabled>
                  ▼ Pilih Contoh Kalimat Hasil & Capaian Belajar (Dropdown)...
                </option>
                {PRESET_RESULTS.map((phrase, idx) => (
                  <option key={idx} value={phrase}>
                    {phrase}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={formData.results || ''}
              onChange={(e) => setFormData({ ...formData, results: e.target.value })}
              placeholder="Catatan ketercapaian pemahaman dan keterampilan siswa..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Kendala Pembelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kendala Pembelajaran
            </label>
            <textarea
              rows={2}
              value={formData.obstacles || ''}
              onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
              placeholder="Kondisi cuaca, sarana/prasarana lapangan, atau kesulitan gerak siswa..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Refleksi Guru (Dropdown Preset + Textarea) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Refleksi Guru
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilih dari dropdown atau ketik mandiri</span>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleApplyPreset('reflection', e.target.value);
                  e.target.value = '';
                }}
                className="w-full text-xs px-2.5 py-1.5 border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="" disabled>
                  ▼ Pilih Contoh Kalimat Refleksi Guru (Dropdown)...
                </option>
                {PRESET_REFLECTIONS.map((phrase, idx) => (
                  <option key={idx} value={phrase}>
                    {phrase}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={formData.reflection || ''}
              onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
              placeholder="Refleksi efektivitas model pembelajaran dan respon antusiasme murid..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Tindak Lanjut Pembelajaran (Dropdown Preset + Textarea) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Tindak Lanjut Pembelajaran
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilih dari dropdown atau ketik mandiri</span>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleApplyPreset('followUp', e.target.value);
                  e.target.value = '';
                }}
                className="w-full text-xs px-2.5 py-1.5 border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="" disabled>
                  ▼ Pilih Contoh Kalimat Tindak Lanjut Pembelajaran (Dropdown)...
                </option>
                {PRESET_FOLLOW_UPS.map((phrase, idx) => (
                  <option key={idx} value={phrase}>
                    {phrase}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={formData.followUp || ''}
              onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
              placeholder="Remedial teknik, pengayaan taktik, atau latihan kebugaran mandiri..."
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
            />
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
                  {getJournalClassNames(activeDetailJournal).join(', ')} · {activeDetailJournal.subject}
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
                <h5 className="font-bold text-slate-800 dark:text-white">Materi Pembelajaran:</h5>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-medium whitespace-pre-line leading-relaxed">
                  {activeDetailJournal.topic}
                </p>
              </div>

              {activeDetailJournal.method && (
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Metode & Model:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{activeDetailJournal.method}</p>
                </div>
              )}

              {activeDetailJournal.activities && (
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Kegiatan Pembelajaran:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line leading-relaxed">
                    {activeDetailJournal.activities}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white">Hasil Pembelajaran & Capaian:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">
                    {activeDetailJournal.results || '-'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white">Kendala Pembelajaran:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">
                    {activeDetailJournal.obstacles || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60">
                  <h5 className="font-bold text-blue-900 dark:text-blue-300">Refleksi Guru:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">
                    {activeDetailJournal.reflection || '-'}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-300">Tindak Lanjut Pembelajaran:</h5>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">
                    {activeDetailJournal.followUp || '-'}
                  </p>
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
