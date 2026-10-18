import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CheckSquare,
  BookOpenCheck,
  GraduationCap,
  Award,
  HeartHandshake,
  UserCheck,
  MessageSquareHeart,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
  X,
} from 'lucide-react';
import { NavigationMenu } from '../../types';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: NavigationMenu;
  label: string;
  icon: React.ElementType;
  section?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Exact 13 items + Pengaturan at the very bottom
  const mainMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'murid', label: 'Data Murid', icon: Users },
    { id: 'jadwal', label: 'Jadwal Mengajar', icon: CalendarClock },
    { id: 'absensi', label: 'Absensi Murid', icon: CheckSquare },
    { id: 'jurnal', label: 'Jurnal Mengajar', icon: BookOpenCheck },
    { id: 'nilai_pengetahuan', label: 'Penilaian Pengetahuan', icon: GraduationCap },
    { id: 'nilai_keterampilan', label: 'Penilaian Keterampilan', icon: Award },
    { id: 'nilai_sikap', label: 'Penilaian Sikap', icon: HeartHandshake },
    { id: 'pendampingan', label: 'Jurnal Pendampingan Murid', icon: UserCheck },
    { id: 'refleksi', label: 'Kartu Refleksi', icon: MessageSquareHeart },
    { id: 'rekap_absensi', label: 'Rekapan Absensi', icon: FileSpreadsheet },
    { id: 'rekap_jurnal', label: 'Rekapan Jurnal', icon: FileText },
    { id: 'rekap_nilai', label: 'Rekapan Nilai', icon: BarChart3 },
  ];

  const handleItemClick = (menu: NavigationMenu) => {
    onSelectMenu(menu);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out no-print ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <School className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                  ADMINISTRASI GURU
                </h1>
                <p className="text-[11px] font-semibold text-blue-400 tracking-wider">
                  DIGITAL INDONESIA
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
              Menu Administrasi
            </div>
          )}

          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                {!isCollapsed && (
                  <span className="truncate text-left flex-1">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: PENGATURAN (Wajib Paling Bawah) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => handleItemClick('pengaturan')}
            title={isCollapsed ? 'Pengaturan' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentMenu === 'pengaturan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <Settings className={`w-4 h-4 shrink-0 ${currentMenu === 'pengaturan' ? 'text-white' : 'text-slate-300'}`} />
            {!isCollapsed && (
              <span className="truncate text-left flex-1">
                Pengaturan
              </span>
            )}
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            title={isCollapsed ? 'Buka Sidebar' : 'Perkecil Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Sembunyikan Menu</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
