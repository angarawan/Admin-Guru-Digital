import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CalendarCheck,
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
  ChevronDown,
  School,
  X,
} from 'lucide-react';
import { NavigationMenu, AppSettings } from '../../types';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  settings?: AppSettings;
}

interface SubMenuItem {
  id: NavigationMenu;
  label: string;
  icon: React.ElementType;
  iconColor: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  items: SubMenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  settings,
}) => {
  // Dropdown groups configuration with bright, vibrant icons without boxed borders
  const menuGroups: MenuGroup[] = [
    {
      id: 'data_pengguna',
      label: 'Data Pengguna',
      icon: Users,
      iconColor: 'text-emerald-400',
      items: [
        {
          id: 'murid',
          label: 'Data Murid',
          icon: Users,
          iconColor: 'text-emerald-300',
        },
        {
          id: 'jadwal',
          label: 'Jadwal Mengajar',
          icon: CalendarClock,
          iconColor: 'text-teal-300',
        },
      ],
    },
    {
      id: 'admin_guru',
      label: 'Admin Guru',
      icon: BookOpenCheck,
      iconColor: 'text-sky-400',
      items: [
        {
          id: 'jurnal',
          label: 'Jurnal Mengajar',
          icon: BookOpenCheck,
          iconColor: 'text-sky-300',
        },
        {
          id: 'absensi',
          label: 'Absensi Murid',
          icon: CalendarCheck,
          iconColor: 'text-cyan-300',
        },
        {
          id: 'pendampingan',
          label: 'Jurnal Pendampingan',
          icon: UserCheck,
          iconColor: 'text-indigo-300',
        },
        {
          id: 'refleksi',
          label: 'Kartu Refleksi',
          icon: MessageSquareHeart,
          iconColor: 'text-pink-300',
        },
      ],
    },
    {
      id: 'penilaian',
      label: 'Penilaian',
      icon: Award,
      iconColor: 'text-amber-400',
      items: [
        {
          id: 'nilai_pengetahuan',
          label: 'Penilaian Pengetahuan',
          icon: GraduationCap,
          iconColor: 'text-amber-300',
        },
        {
          id: 'nilai_keterampilan',
          label: 'Penilaian Keterampilan',
          icon: Award,
          iconColor: 'text-orange-400',
        },
        {
          id: 'nilai_sikap',
          label: 'Penilaian Sikap',
          icon: HeartHandshake,
          iconColor: 'text-rose-300',
        },
      ],
    },
    {
      id: 'rekapan',
      label: 'Rekapan',
      icon: FileSpreadsheet,
      iconColor: 'text-purple-400',
      items: [
        {
          id: 'rekap_jurnal',
          label: 'Rekap Jurnal',
          icon: FileText,
          iconColor: 'text-violet-300',
        },
        {
          id: 'rekap_absensi',
          label: 'Rekap Absen',
          icon: FileSpreadsheet,
          iconColor: 'text-purple-300',
        },
        {
          id: 'rekap_nilai',
          label: 'Rekap Nilai',
          icon: BarChart3,
          iconColor: 'text-fuchsia-300',
        },
      ],
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: FileSpreadsheet,
      iconColor: 'text-amber-400',
      items: [
        {
          id: 'laporan_pelaksanaan',
          label: 'Laporan Pelaksanaan Pembelajaran',
          icon: FileText,
          iconColor: 'text-sky-300',
        },
        {
          id: 'laporan_penilaian',
          label: 'Laporan Penilaian',
          icon: Award,
          iconColor: 'text-emerald-300',
        },
      ],
    },
  ];

  // Accordion state: by default keep all groups closed/collapsed when app is first opened
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    data_pengguna: false,
    admin_guru: false,
    penilaian: false,
    rekapan: false,
    laporan: false,
  });

  // Ensure the group containing the active menu is open
  useEffect(() => {
    menuGroups.forEach((group) => {
      if (group.items.some((item) => item.id === currentMenu)) {
        setOpenGroups((prev) => ({
          ...prev,
          [group.id]: true,
        }));
      }
    });
  }, [currentMenu]);

  const toggleGroup = (groupId: string) => {
    if (isCollapsed) {
      onToggleCollapse();
      setOpenGroups((prev) => ({
        ...prev,
        [groupId]: true,
      }));
      return;
    }
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleItemClick = (menu: NavigationMenu) => {
    onSelectMenu(menu);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out no-print ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden p-1">
              {settings?.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt="Logo Sekolah"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <School className="w-5 h-5 text-white" />
              )}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                  {settings?.schoolName || 'ADMINISTRASI GURU'}
                </h1>
                <p className="text-[11px] font-semibold text-blue-400 tracking-wider truncate">
                  {settings?.teacherName || 'DIGITAL INDONESIA'}
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
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 custom-scrollbar">
          {/* Fitur Dasbor (Top Level) */}
          <button
            type="button"
            onClick={() => handleItemClick('dashboard')}
            title={isCollapsed ? 'Dasbor' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              currentMenu === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <LayoutDashboard
              className={`w-5 h-5 shrink-0 transition-colors ${
                currentMenu === 'dashboard' ? 'text-white' : 'text-sky-300'
              }`}
            />
            {!isCollapsed && (
              <span className="truncate text-left flex-1 font-semibold">
                Dasbor
              </span>
            )}
          </button>

          {/* Dropdown Groups */}
          {menuGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = !!openGroups[group.id];
            const hasActiveChild = group.items.some((item) => item.id === currentMenu);

            return (
              <div key={group.id} className="pt-1">
                {/* Group Dropdown Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  title={isCollapsed ? group.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    hasActiveChild
                      ? 'text-white font-semibold bg-slate-800/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <GroupIcon className={`w-4 h-4 shrink-0 ${group.iconColor}`} />
                    {!isCollapsed && (
                      <span className="truncate font-semibold tracking-wide uppercase text-[11px]">
                        {group.label}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  )}
                </button>

                {/* Sub Menu Items (Accordion content) */}
                {isOpen && !isCollapsed && (
                  <div className="mt-1 ml-3.5 pl-3 border-l border-slate-800/80 space-y-1">
                    {group.items.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentMenu === subItem.id;

                      return (
                        <button
                          key={subItem.id}
                          type="button"
                          onClick={() => handleItemClick(subItem.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            isSubActive
                              ? 'bg-blue-600 text-white font-semibold shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium'
                          }`}
                        >
                          <SubIcon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isSubActive ? 'text-white' : subItem.iconColor
                            }`}
                          />
                          <span className="truncate text-left flex-1">
                            {subItem.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section: PENGATURAN (Wajib Paling Bawah) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => handleItemClick('pengaturan')}
            title={isCollapsed ? 'Pengaturan' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentMenu === 'pengaturan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <Settings
              className={`w-5 h-5 shrink-0 transition-colors ${
                currentMenu === 'pengaturan' ? 'text-white' : 'text-slate-300'
              }`}
            />
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
            className="hidden lg:flex w-full items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
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
