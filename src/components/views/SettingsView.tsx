import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  Building2,
  Layers,
  Database,
  Cloud,
  FileCode,
  RefreshCw,
  HelpCircle,
  Sun,
  Moon,
  Smartphone,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  FileImage,
} from 'lucide-react';
import {
  AppSettings,
  ClassItem,
  PeriodTime,
} from '../../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../services/googleAppsScriptCode';
import { pingAppsScript, runSetupSpreadsheetRemote } from '../../services/api';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { PWAInstallButton } from '../ui/PWAInstallModal';

interface SettingsViewProps {
  settings: AppSettings;
  classes: ClassItem[];
  periods: PeriodTime[];
  onSaveSettings: (settings: AppSettings) => Promise<{ success: boolean; message?: string }>;
  onSaveClass: (item: ClassItem) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
  onSavePeriods: (periods: PeriodTime[]) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  classes,
  periods,
  onSaveSettings,
  onSaveClass,
  onDeleteClass,
  onSavePeriods,
}) => {
  const { isDarkMode, toggleDarkMode, setDarkMode } = useTheme();

  // Tab within Settings
  const [activeTab, setActiveTab] = useState<'umum' | 'kelas_jam' | 'gas_setup'>('umum');

  // General Settings State
  const [formData, setFormData] = useState<AppSettings>({ ...settings, darkMode: isDarkMode });
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Class Management State
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('X');
  const [newClassHomeroom, setNewClassHomeroom] = useState('');

  // Periods State
  const [localPeriods, setLocalPeriods] = useState<PeriodTime[]>([...periods]);

  // Google Apps Script Testing State
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Logo Input Mode (Upload File vs Isi URL)
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');

  // Tut Wuri Handayani Official Vector Preset
  const TUT_WURI_HANDAYANI_SVG =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="95" fill="%230b5cad"/><circle cx="100" cy="100" r="86" fill="none" stroke="%23f9d616" stroke-width="5"/><polygon points="100,20 120,70 175,70 130,105 148,160 100,128 52,160 70,105 25,70 80,70" fill="%23f9d616"/><circle cx="100" cy="100" r="28" fill="%23ffffff"/><polygon points="100,78 106,94 122,94 109,104 114,120 100,111 86,120 91,104 78,94 94,94" fill="%23d9222a"/><path d="M70,145 Q100,165 130,145" stroke="%23ffffff" stroke-width="6" fill="none" stroke-linecap="round"/><text x="100" y="180" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23ffffff" text-anchor="middle">TUT WURI HANDAYANI</text></svg>';

  // Handle Logo Upload from Local Device (File / Foto)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      // If image is large (> 400KB) and not SVG, resize via canvas to ensure localStorage stays fast
      if (file.size > 400 * 1024 && !file.type.includes('svg')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/png', 0.9);
            setFormData((prev) => ({ ...prev, schoolLogo: compressed }));
          } else {
            setFormData((prev) => ({ ...prev, schoolLogo: result }));
          }
        };
        img.src = result;
      } else {
        setFormData((prev) => ({ ...prev, schoolLogo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setFormData((prev) => ({ ...prev, schoolLogo: '' }));
  };

  const handleSetTutWuriPreset = () => {
    setFormData((prev) => ({ ...prev, schoolLogo: TUT_WURI_HANDAYANI_SVG }));
  };

  // Save General Settings
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await onSaveSettings({ ...formData, darkMode: isDarkMode });
      setSaveStatus({
        message: res.message || 'Pengaturan berhasil disimpan!',
        isError: !res.success,
      });
    } catch (e: any) {
      setSaveStatus({
        message: 'Gagal menyimpan: ' + e.message,
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add Class
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const item: ClassItem = {
      id: `cls-${Date.now()}`,
      name: newClassName.trim(),
      level: newClassLevel,
      homeroomTeacher: newClassHomeroom.trim() || undefined,
    };

    await onSaveClass(item);
    setNewClassName('');
    setNewClassHomeroom('');
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    if (confirm(`Hapus kelas ${cls.name}? Pastikan tidak ada murid aktif yang tertinggal.`)) {
      await onDeleteClass(cls.id);
    }
  };

  // Periods change
  const handlePeriodTimeChange = (periodIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = localPeriods.map((p) => {
      if (p.period === periodIndex) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setLocalPeriods(updated);
  };

  const handleSavePeriods = async () => {
    await onSavePeriods(localPeriods);
    alert('Jadwal jam pelajaran 0 sampai 10 berhasil diperbarui!');
  };

  // Test GAS Connection
  const handleTestConnection = async () => {
    if (!formData.appsScriptUrl) {
      setTestResult({
        status: 'error',
        message: 'Masukkan URL Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsTestingConn(true);
    setTestResult({ status: 'idle', message: 'Menghubungi Google Apps Script Web App...' });

    const res = await pingAppsScript(formData.appsScriptUrl);
    setIsTestingConn(false);

    if (res.status === 'success') {
      setTestResult({
        status: 'success',
        message: 'Koneksi Berhasil! API merespons dengan status 200 OK.',
      });
    } else {
      setTestResult({
        status: 'error',
        message: res.message || 'Gagal terhubung ke URL Web App. Periksa apakah deployment sudah diset "Anyone".',
      });
    }
  };

  // Run Remote Setup Spreadsheet
  const handleRunRemoteSetup = async () => {
    if (!formData.appsScriptUrl) {
      alert('Masukkan URL Google Apps Script terlebih dahulu.');
      return;
    }

    if (!confirm('Apakah Anda ingin menginisialisasi seluruh sheet (13 sheet) otomatis di Google Spreadsheet Anda?')) {
      return;
    }

    setIsTestingConn(true);
    try {
      const res = await runSetupSpreadsheetRemote(formData.appsScriptUrl);
      if (res.status === 'success') {
        alert('Berhasil! Seluruh sheet dan header telah dibuat otomatis di Spreadsheet Anda.');
      } else {
        alert('Gagal inisialisasi: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Pengaturan Aplikasi & Integrasi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Konfigurasi profil guru, preferensi tema, struktur jam pelajaran, daftar kelas, dan integrasi Google Apps Script & Spreadsheet.
          </p>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-semibold ${
            saveStatus.isError
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {saveStatus.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('umum')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'umum'
              ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Profil & Tema
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kelas_jam')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'kelas_jam'
              ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Kelas & Jam Pelajaran
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gas_setup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gas_setup'
              ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Google Apps Script & Database
        </button>
      </div>

      {/* TAB 1: UMUM / PROFIL & TEMA */}
      {activeTab === 'umum' && (
        <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 space-y-6">
          {/* Theme Preferences Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Tema Tampilan Aplikasi (Dark Mode / Light Mode)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih mode gelap untuk kenyamanan mata saat menginput nilai dan administrasi pada malam hari. Preferensi otomatis tersimpan permanen di peramban (localStorage).
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDarkMode(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    !isDarkMode
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Terang
                </button>
                <button
                  type="button"
                  onClick={() => setDarkMode(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    isDarkMode
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Gelap
                </button>
              </div>
            </div>
          </div>

          {/* PWA Mobile Installation Card */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Instalasi Aplikasi di HP (Progressive Web App)
                </h4>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                  Pasang aplikasi di layar beranda ponsel (Android / iPhone) agar dapat diakses cepat layaknya aplikasi Play Store / App Store tanpa bilah alamat browser.
                </p>
              </div>
              <div className="shrink-0">
                <PWAInstallButton />
              </div>
            </div>
          </div>

          {/* Section: Profil Guru */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Profil Guru Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Identitas guru yang akan tercantum pada tanda tangan dan lembar administrasi.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Guru (dengan Gelar) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Guru (Nomor Induk Pegawai - Opsional)
                </label>
                <input
                  type="text"
                  value={formData.teacherNip}
                  onChange={(e) => setFormData({ ...formData, teacherNip: e.target.value })}
                  placeholder="Contoh: 19780512 200501 2 004"
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Kepala Sekolah (Diisi Manual) */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Kepala Sekolah / Pimpinan Satuan Pendidikan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nama dan NIP Kepala Sekolah akan tercantum secara otomatis pada kolom pengesahan & tanda tangan &quot;Mengetahui&quot; di seluruh dokumen cetak / PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kepala Sekolah (dengan Gelar) *
                </label>
                <input
                  type="text"
                  value={formData.principalName || ''}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  placeholder="Contoh: Dr. H. Ahmad Dahlan, M.Pd"
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Kepala Sekolah (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.principalNip || ''}
                  onChange={(e) => setFormData({ ...formData, principalNip: e.target.value })}
                  placeholder="Contoh: 19680315 199303 1 002"
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Identitas Satuan Pendidikan & Periode */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Satuan Pendidikan & Periode Akademik</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Informasi nama sekolah dan semester aktif pada kop surat.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Sekolah / Instansi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran yang Diampu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Ajaran Aktif *
                </label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024/2025"
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Semester Aktif *
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Logo Sekolah (Upload Manual / Isi Manual) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Logo Resmi Sekolah (Kop Surat & Laporan Cetak)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Bisa di-upload manual dari perangkat (file gambar) atau diisi manual berupa tautan / URL gambar web.
                </p>
              </div>

              {/* Mode Selector Tab: Upload vs URL */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setLogoInputMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                    logoInputMode === 'upload'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                    logoInputMode === 'url'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Isi URL Web
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-1">
              {/* Input Area (2 cols) */}
              <div className="md:col-span-2 space-y-2.5">
                {logoInputMode === 'upload' ? (
                  <div>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-4 bg-white dark:bg-slate-900 cursor-pointer transition-colors group">
                      <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2">
                        Pilih Gambar Logo dari Perangkat (HP / Laptop)
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Mendukung format PNG, JPG, JPEG, SVG, WebP (Maks. 2MB)
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Ketik / Tempel URL Gambar Logo
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={formData.schoolLogo || ''}
                        onChange={(e) => setFormData({ ...formData, schoolLogo: e.target.value })}
                        placeholder="https://example.com/logo-sekolah.png"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                )}

                {/* Preset & Action Options */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={handleSetTutWuriPreset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Gunakan Logo Tut Wuri Handayani
                  </button>
                  {formData.schoolLogo && (
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 text-[11px] font-medium text-rose-700 dark:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus Logo
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Box (1 col) */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center min-h-[120px]">
                {formData.schoolLogo ? (
                  <div className="space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src={formData.schoolLogo}
                        alt="Pratinjau Logo Sekolah"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Logo Terpasang
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-400 dark:text-slate-500 py-2">
                    <FileImage className="w-8 h-8 mx-auto stroke-1" />
                    <p className="text-[11px]">Belum ada logo</p>
                    <p className="text-[10px] text-slate-400">Pratinjau akan muncul di sini</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: KELAS & JAM PELAJARAN 0-10 */}
      {activeTab === 'kelas_jam' && (
        <div className="space-y-6">
          {/* Class Management Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Manajemen Rombel / Kelas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tambah, edit, atau hapus kelas yang Anda ajar.</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md">
                {classes.length} Kelas Terdaftar
              </span>
            </div>

            {/* Form Tambah Kelas */}
            <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Contoh: XII-MIPA 2"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Tingkat</label>
                <select
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Wali Kelas (Opsional)</label>
                <input
                  type="text"
                  value={newClassHomeroom}
                  onChange={(e) => setNewClassHomeroom(e.target.value)}
                  placeholder="Nama wali kelas..."
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Kelas
                </button>
              </div>
            </form>

            {/* Daftar Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => (
                <div key={cls.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">{cls.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tingkat: {cls.level} {cls.homeroomTeacher ? `· Wali: ${cls.homeroomTeacher}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(cls)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Period Times 0 - 10 Setup (Mandatory Section 4 & 15) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Pengaturan Jam Pelajaran Ke-0 Sampai Ke-10
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tentukan waktu mulai dan selesai untuk masing-masing jam pelajaran sekolah Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePeriods}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Waktu Jam Pelajaran
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3 w-20 text-center">Jam Ke-</th>
                    <th className="py-2 px-3">Keterangan / Sesi</th>
                    <th className="py-2 px-3 w-40 text-center">Waktu Mulai</th>
                    <th className="py-2 px-3 w-40 text-center">Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {localPeriods.map((p) => (
                    <tr key={p.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                        {p.period}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {p.name}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="time"
                          value={p.startTime}
                          onChange={(e) => handlePeriodTimeChange(p.period, 'startTime', e.target.value)}
                          className="font-mono text-xs px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="time"
                          value={p.endTime}
                          onChange={(e) => handlePeriodTimeChange(p.period, 'endTime', e.target.value)}
                          className="font-mono text-xs px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE APPS SCRIPT & DATABASE (Spreadsheet & Drive) */}
      {activeTab === 'gas_setup' && (
        <div className="space-y-6">
          {/* Endpoint Configuration Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Konfigurasi Google Apps Script Web App</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Satu sumber database permanen: Google Spreadsheet & Google Drive untuk tanda tangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60"
              >
                <FileCode className="w-3.5 h-3.5" />
                Lihat & Salin Kode Apps Script
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL Google Apps Script Web App (Wajib untuk Penyimpanan Permanen) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.appsScriptUrl}
                    onChange={(e) => setFormData({ ...formData, appsScriptUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isTestingConn || !formData.appsScriptUrl}
                    onClick={handleTestConnection}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {isTestingConn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Uji Koneksi
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  URL didapat setelah Anda melakukan <em>Deploy {'>'} New deployment {'>'} Web app</em> di editor Apps Script Google Sheets.
                </p>
              </div>

              {testResult.message && (
                <div
                  className={`p-3 rounded-lg border text-xs font-medium ${
                    testResult.status === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Google Spreadsheet (Opsional untuk Catatan)
                  </label>
                  <input
                    type="text"
                    value={formData.spreadsheetId || ''}
                    onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Folder ID Google Drive (Untuk Tanda Tangan Digital)
                  </label>
                  <input
                    type="text"
                    value={formData.driveFolderId || ''}
                    onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
                    placeholder="Kosongkan jika ingin dibuat otomatis di Drive root"
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={!formData.appsScriptUrl || isTestingConn}
                  onClick={handleRunRemoteSetup}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold disabled:opacity-40"
                >
                  <Database className="w-3.5 h-3.5" />
                  Inisialisasi Seluruh 13 Sheet Otomatis
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveGeneral}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan URL Integrasi'}
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Deployment Guide Box (Section 1 & 19) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Petunjuk Langkah Demi Langkah Setup Backend Google Apps Script & Spreadsheet
            </h3>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">Buat Google Spreadsheet Baru:</strong>
                  Buka peramban Anda dan kunjungi{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    sheets.new
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  . Beri nama file Spreadsheet, misalnya <em>"Database Administrasi Guru Digital"</em>.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">Buka Editor Apps Script:</strong>
                  Pada menu bar Google Spreadsheet, klik menu <strong>Ekstensi</strong> {'>'}{' '}
                  <strong>Apps Script</strong>.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">Tempel (Paste) Kode Script:</strong>
                  Hapus semua kode bawaan di file <code>Code.gs</code>, kemudian klik tombol{' '}
                  <button
                    type="button"
                    onClick={() => setIsCodeModalOpen(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    "Lihat & Salin Kode Apps Script"
                  </button>{' '}
                  di atas dan tempelkan ke editor. Tekan Ctrl+S (Simpan).
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">Jalankan fungsi setupSpreadsheet():</strong>
                  Pilih fungsi <code>setupSpreadsheet</code> pada dropdown di bagian atas editor Apps Script,
                  lalu klik tombol <strong>Jalankan (Run)</strong>. Setujui izin akses Google. Seluruh 13 sheet dan
                  format header warna navy blue akan otomatis terbuat!
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">Deploy sebagai Web App:</strong>
                  Klik tombol biru <strong>Deploy</strong> {'>'} <strong>New deployment</strong>.
                  Pilih tipe: <strong>Web app</strong>. Isi:
                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                    <li>Execute as: <strong>Me (email Anda)</strong></li>
                    <li>Who has access: <strong>Anyone (Siapa saja)</strong> <em>(Penting agar aplikasi web dapat mengirimkan data)</em></li>
                  </ul>
                  Klik <strong>Deploy</strong>, lalu salin (copy) <strong>Web App URL</strong> yang dihasilkan.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  6
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">Tempelkan URL ke Aplikasi:</strong>
                  Tempelkan URL Web App pada kolom di atas, lalu klik <strong>Uji Koneksi</strong> dan{' '}
                  <strong>Simpan URL Integrasi</strong>. Selesai!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE APPS SCRIPT & DATABASE (Spreadsheet & Drive) */}
      {activeTab === 'gas_setup' && (
        <div className="space-y-6">
          {/* Endpoint Configuration Box */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Konfigurasi Google Apps Script Web App</h3>
                <p className="text-xs text-slate-500">
                  Satu sumber database permanen: Google Spreadsheet & Google Drive untuk tanda tangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
              >
                <FileCode className="w-3.5 h-3.5" />
                Lihat & Salin Kode Apps Script
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Google Apps Script Web App (Wajib untuk Penyimpanan Permanen) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.appsScriptUrl}
                    onChange={(e) => setFormData({ ...formData, appsScriptUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isTestingConn || !formData.appsScriptUrl}
                    onClick={handleTestConnection}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {isTestingConn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Uji Koneksi
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  URL didapat setelah Anda melakukan <em>Deploy {'>'} New deployment {'>'} Web app</em> di editor Apps Script Google Sheets.
                </p>
              </div>

              {testResult.message && (
                <div
                  className={`p-3 rounded-lg border text-xs font-medium ${
                    testResult.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Google Spreadsheet (Opsional untuk Catatan)
                  </label>
                  <input
                    type="text"
                    value={formData.spreadsheetId || ''}
                    onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Folder ID Google Drive (Untuk Tanda Tangan Digital)
                  </label>
                  <input
                    type="text"
                    value={formData.driveFolderId || ''}
                    onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
                    placeholder="Kosongkan jika ingin dibuat otomatis di Drive root"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={!formData.appsScriptUrl || isTestingConn}
                  onClick={handleRunRemoteSetup}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold disabled:opacity-40"
                >
                  <Database className="w-3.5 h-3.5" />
                  Inisialisasi Seluruh 13 Sheet Otomatis
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveGeneral}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan URL Integrasi'}
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Deployment Guide Box (Section 1 & 19) */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Petunjuk Langkah Demi Langkah Setup Backend Google Apps Script & Spreadsheet
            </h3>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block">Buat Google Spreadsheet Baru:</strong>
                  Buka peramban Anda dan kunjungi{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    sheets.new
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  . Beri nama file Spreadsheet, misalnya <em>"Database Administrasi Guru Digital"</em>.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block">Buka Editor Apps Script:</strong>
                  Pada menu bar Google Spreadsheet, klik menu <strong>Ekstensi</strong> {'>'}{' '}
                  <strong>Apps Script</strong>.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block">Tempel (Paste) Kode Script:</strong>
                  Hapus semua kode bawaan di file <code>Code.gs</code>, kemudian klik tombol{' '}
                  <button
                    type="button"
                    onClick={() => setIsCodeModalOpen(true)}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    "Lihat & Salin Kode Apps Script"
                  </button>{' '}
                  di atas dan tempelkan ke editor. Tekan Ctrl+S (Simpan).
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 block">Jalankan fungsi setupSpreadsheet():</strong>
                  Pilih fungsi <code>setupSpreadsheet</code> pada dropdown di bagian atas editor Apps Script,
                  lalu klik tombol <strong>Jalankan (Run)</strong>. Setujui izin akses Google (Review
                  Permissions {'>'} Advanced {'>'} Go to ... (unsafe) {'>'} Allow). Seluruh 13 sheet dan
                  format header warna navy blue akan otomatis terbuat!
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </span>
                <div>
                  <strong className="text-slate-900 block">Deploy sebagai Web App:</strong>
                  Klik tombol biru <strong>Deploy</strong> {'>'} <strong>New deployment</strong>.
                  Pilih tipe: <strong>Web app</strong>. Isi:
                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-600">
                    <li>Execute as: <strong>Me (email Anda)</strong></li>
                    <li>Who has access: <strong>Anyone (Siapa saja)</strong> <em>(Penting agar aplikasi web dapat mengirimkan data)</em></li>
                  </ul>
                  Klik <strong>Deploy</strong>, lalu salin (copy) <strong>Web App URL</strong> yang dihasilkan.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  6
                </span>
                <div>
                  <strong className="text-slate-900 block">Tempelkan URL ke Aplikasi:</strong>
                  Tempelkan URL Web App pada kolom di atas, lalu klik <strong>Uji Koneksi</strong> dan{' '}
                  <strong>Simpan URL Integrasi</strong>. Selesai!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="Kode Lengkap Google Apps Script (Code.gs)"
        maxWidth="4xl"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Salin seluruh kode di bawah dan tempelkan ke editor Google Apps Script Anda.
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode'}
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs border border-slate-800">
            <pre className="whitespace-pre">{GOOGLE_APPS_SCRIPT_CODE}</pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};
