import React from 'react';
import {
  Menu,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  GraduationCap,
  Cloud,
  Sun,
  Moon,
} from 'lucide-react';
import { AppSettings, NavigationMenu } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { PWAInstallButton } from '../ui/PWAInstallModal';

interface HeaderProps {
  settings: AppSettings;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  syncStatus: {
    isSyncing: boolean;
    statusText: string;
    isError: boolean;
    lastSyncTime?: string;
  };
  onManualSync: () => void;
  onNavigateToSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
  syncStatus,
  onManualSync,
  onNavigateToSettings,
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Indonesian Date Formatter
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const hasAppsScript = Boolean(settings.appsScriptUrl);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-2xs px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors no-print">
      {/* Left zone: Toggle Button + App Branding / Title */}
      <div className="flex items-center gap-3">
        {/* Mobile toggle */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Perkecil/Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              ADMINISTRASI GURU DIGITAL
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              · {settings.schoolName || 'Sekolah Penggerak'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              {settings.teacherName || 'Guru Pengajar'}
            </span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              TA {settings.academicYear} ({settings.semester})
            </span>
          </div>
        </div>
      </div>

      {/* Right zone: Date & Storage Sync Indicator & Dark Mode Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
          title={isDarkMode ? 'Beralih ke Tema Terang (Light Mode)' : 'Beralih ke Tema Gelap (Dark Mode)'}
          aria-label="Toggle tema gelap / terang"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Sync Status Badge / Action */}
        <div className="flex items-center gap-2">
          {hasAppsScript ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                syncStatus.isError
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
                  : syncStatus.isSyncing
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
              }`}
              onClick={onManualSync}
              title={
                syncStatus.lastSyncTime
                  ? `Terakhir sinkron: ${syncStatus.lastSyncTime}. Klik untuk sinkron ulang.`
                  : 'Klik untuk sinkron data dengan Google Spreadsheet'
              }
            >
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
              ) : syncStatus.isError ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="hidden sm:inline truncate max-w-[180px]">
                {syncStatus.isSyncing
                  ? 'Menyimpan...'
                  : syncStatus.isError
                  ? 'Gagal Sinkron'
                  : 'Spreadsheet Terhubung'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Klik untuk menyambungkan ke Google Spreadsheet & Google Apps Script"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Setel Google Sheets</span>
              <span className="sm:hidden">Sheets</span>
            </button>
          )}

          {hasAppsScript && !syncStatus.isSyncing && (
            <button
              type="button"
              onClick={onManualSync}
              className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Sinkronkan dengan Google Spreadsheet sekarang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

