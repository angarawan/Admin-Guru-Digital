import React, { useState, useEffect } from 'react';
import {
  AppSettings,
  ClassItem,
  PeriodTime,
  Student,
  ScheduleItem,
  AttendanceRecord,
  TeachingJournal,
  KnowledgeAssessment,
  SkillAssessment,
  AttitudeAssessment,
  MentoringJournal,
  ReflectionCard,
  NavigationMenu,
} from './types';

import {
  getSettings,
  saveSettings,
  getClasses,
  saveClass,
  deleteClass,
  getPeriods,
  savePeriods,
  getStudents,
  saveStudent,
  batchSaveStudents,
  deleteStudent,
  deleteStudentsBatch,
  getSchedules,
  saveSchedule,
  deleteSchedule,
  deleteSchedulesBatch,
  getAttendance,
  saveAttendanceBatch,
  deleteAttendanceBatch,
  getJournals,
  saveJournal,
  deleteJournal,
  deleteJournalsBatch,
  getKnowledgeAssessments,
  saveKnowledgeAssessmentBatch,
  deleteKnowledgeAssessment,
  deleteKnowledgeAssessmentsBatch,
  getSkillAssessments,
  saveSkillAssessmentBatch,
  deleteSkillAssessment,
  deleteSkillAssessmentsBatch,
  getAttitudeAssessments,
  saveAttitudeAssessmentBatch,
  deleteAttitudeAssessment,
  deleteAttitudeAssessmentsBatch,
  getMentoringJournals,
  resetMentoringJournals,
  saveMentoringJournal,
  deleteMentoringJournal,
  deleteMentoringJournalsBatch,
  getReflections,
  saveReflection,
  deleteReflection,
  deleteReflectionsBatch,
  syncAllFromRemote,
  subscribeSyncStatus,
} from './services/storage';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { ScheduleView } from './components/views/ScheduleView';
import { AttendanceView } from './components/views/AttendanceView';
import { JournalView } from './components/views/JournalView';
import { KnowledgeAssessmentView } from './components/views/KnowledgeAssessmentView';
import { SkillAssessmentView } from './components/views/SkillAssessmentView';
import { AttitudeAssessmentView } from './components/views/AttitudeAssessmentView';
import { MentoringJournalView } from './components/views/MentoringJournalView';
import { ReflectionCardView } from './components/views/ReflectionCardView';
import { AttendanceRecapView } from './components/views/AttendanceRecapView';
import { JournalRecapView } from './components/views/JournalRecapView';
import { GradesRecapView } from './components/views/GradesRecapView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  // Navigation State
  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Entities State
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [classes, setClasses] = useState<ClassItem[]>(getClasses());
  const [periods, setPeriods] = useState<PeriodTime[]>(getPeriods());
  const [students, setStudents] = useState<Student[]>(getStudents());
  const [schedules, setSchedules] = useState<ScheduleItem[]>(getSchedules());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(getAttendance());
  const [journals, setJournals] = useState<TeachingJournal[]>(getJournals());
  const [knowledgeAssessments, setKnowledgeAssessments] = useState<KnowledgeAssessment[]>(
    getKnowledgeAssessments()
  );
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>(
    getSkillAssessments()
  );
  const [attitudeAssessments, setAttitudeAssessments] = useState<AttitudeAssessment[]>(
    getAttitudeAssessments()
  );
  const [mentoringJournals, setMentoringJournals] = useState<MentoringJournal[]>(
    getMentoringJournals()
  );
  const [reflections, setReflections] = useState<ReflectionCard[]>(getReflections());

  // Storage and Sync Status
  const [syncStatus, setSyncStatus] = useState<{
    isSyncing: boolean;
    statusText: string;
    isError: boolean;
    lastSyncTime?: string;
  }>({
    isSyncing: false,
    statusText: settings.appsScriptUrl ? 'Tersambung ke Google Spreadsheet' : 'Penyimpanan Lokal Aktif',
    isError: false,
  });

  // Subscribe to background sync updates
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Ensure initial mentoring records are loaded if empty
  useEffect(() => {
    if (mentoringJournals.length === 0) {
      const init = getMentoringJournals();
      if (init && init.length > 0) {
        setMentoringJournals(init);
      }
    }
  }, [mentoringJournals.length]);

  // Reload all states from storage helper
  const reloadAllLocalData = () => {
    setSettings(getSettings());
    setClasses(getClasses());
    setPeriods(getPeriods());
    setStudents(getStudents());
    setSchedules(getSchedules());
    setAttendance(getAttendance());
    setJournals(getJournals());
    setKnowledgeAssessments(getKnowledgeAssessments());
    setSkillAssessments(getSkillAssessments());
    setAttitudeAssessments(getAttitudeAssessments());
    setMentoringJournals(getMentoringJournals());
    setReflections(getReflections());
  };

  // Sync with remote Apps Script
  const handleManualSync = async () => {
    const res = await syncAllFromRemote();
    if (res.success) {
      reloadAllLocalData();
    }
  };

  // Entity Handlers
  const handleSaveSettings = async (newSettings: AppSettings) => {
    const res = await saveSettings(newSettings);
    setSettings(newSettings);
    return res;
  };

  const handleSaveClass = async (item: ClassItem) => {
    await saveClass(item);
    setClasses(getClasses());
  };

  const handleDeleteClass = async (id: string) => {
    await deleteClass(id);
    setClasses(getClasses());
  };

  const handleSavePeriods = async (newPeriods: PeriodTime[]) => {
    await savePeriods(newPeriods);
    setPeriods(newPeriods);
  };

  const handleSaveStudent = async (student: Student) => {
    await saveStudent(student);
    setStudents(getStudents());
  };

  const handleBatchSaveStudents = async (newStudents: Student[]) => {
    await batchSaveStudents(newStudents);
    setStudents(getStudents());
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
    setStudents(getStudents());
  };

  const handleSaveSchedule = async (item: ScheduleItem) => {
    await saveSchedule(item);
    setSchedules(getSchedules());
  };

  const handleDeleteSchedule = async (id: string) => {
    await deleteSchedule(id);
    setSchedules(getSchedules());
  };

  const handleSaveAttendanceBatch = async (records: AttendanceRecord[]) => {
    await saveAttendanceBatch(records);
    setAttendance(getAttendance());
  };

  const handleSaveJournal = async (journal: TeachingJournal) => {
    await saveJournal(journal);
    setJournals(getJournals());
  };

  const handleDeleteJournal = async (id: string) => {
    await deleteJournal(id);
    setJournals(getJournals());
  };

  const handleSaveKnowledgeBatch = async (records: KnowledgeAssessment[]) => {
    await saveKnowledgeAssessmentBatch(records);
    setKnowledgeAssessments(getKnowledgeAssessments());
  };

  const handleDeleteKnowledge = async (id: string) => {
    await deleteKnowledgeAssessment(id);
    setKnowledgeAssessments(getKnowledgeAssessments());
  };

  const handleSaveSkillBatch = async (records: SkillAssessment[]) => {
    await saveSkillAssessmentBatch(records);
    setSkillAssessments(getSkillAssessments());
  };

  const handleDeleteSkill = async (id: string) => {
    await deleteSkillAssessment(id);
    setSkillAssessments(getSkillAssessments());
  };

  const handleSaveAttitudeBatch = async (records: AttitudeAssessment[]) => {
    await saveAttitudeAssessmentBatch(records);
    setAttitudeAssessments(getAttitudeAssessments());
  };

  const handleDeleteAttitude = async (id: string) => {
    await deleteAttitudeAssessment(id);
    setAttitudeAssessments(getAttitudeAssessments());
  };

  const handleSaveMentoringJournal = async (journal: MentoringJournal) => {
    await saveMentoringJournal(journal);
    setMentoringJournals(getMentoringJournals());
  };

  const handleDeleteMentoringJournal = async (id: string) => {
    await deleteMentoringJournal(id);
    setMentoringJournals(getMentoringJournals());
  };

  const handleSaveReflection = async (card: ReflectionCard) => {
    await saveReflection(card);
    setReflections(getReflections());
  };

  const handleDeleteReflection = async (id: string) => {
    await deleteReflection(id);
    setReflections(getReflections());
  };

  const handleBatchDeleteStudents = async (ids: string[]) => {
    await deleteStudentsBatch(ids);
    setStudents(getStudents());
  };

  const handleBatchDeleteSchedules = async (ids: string[]) => {
    await deleteSchedulesBatch(ids);
    setSchedules(getSchedules());
  };

  const handleBatchDeleteAttendance = async (ids: string[]) => {
    await deleteAttendanceBatch(ids);
    setAttendance(getAttendance());
  };

  const handleBatchDeleteJournals = async (ids: string[]) => {
    await deleteJournalsBatch(ids);
    setJournals(getJournals());
  };

  const handleBatchDeleteKnowledge = async (ids: string[]) => {
    await deleteKnowledgeAssessmentsBatch(ids);
    setKnowledgeAssessments(getKnowledgeAssessments());
  };

  const handleBatchDeleteSkills = async (ids: string[]) => {
    await deleteSkillAssessmentsBatch(ids);
    setSkillAssessments(getSkillAssessments());
  };

  const handleBatchDeleteAttitude = async (ids: string[]) => {
    await deleteAttitudeAssessmentsBatch(ids);
    setAttitudeAssessments(getAttitudeAssessments());
  };

  const handleBatchDeleteMentoring = async (ids: string[]) => {
    await deleteMentoringJournalsBatch(ids);
    setMentoringJournals(getMentoringJournals());
  };

  const handleBatchDeleteReflections = async (ids: string[]) => {
    await deleteReflectionsBatch(ids);
    setReflections(getReflections());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menu) => setCurrentMenu(menu)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header / Taskbar */}
        <Header
          settings={settings}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          syncStatus={syncStatus}
          onManualSync={handleManualSync}
          onNavigateToSettings={() => setCurrentMenu('pengaturan')}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentMenu === 'dashboard' && (
            <DashboardView
              settings={settings}
              classes={classes}
              students={students}
              schedules={schedules}
              attendance={attendance}
              journals={journals}
              mentoringJournals={mentoringJournals}
              onNavigate={(menu) => setCurrentMenu(menu)}
            />
          )}

          {currentMenu === 'murid' && (
            <StudentsView
              students={students}
              classes={classes}
              settings={settings}
              onSaveStudent={handleSaveStudent}
              onBatchSaveStudents={handleBatchSaveStudents}
              onDeleteStudent={handleDeleteStudent}
              onBatchDeleteStudents={handleBatchDeleteStudents}
            />
          )}

          {currentMenu === 'jadwal' && (
            <ScheduleView
              schedules={schedules}
              classes={classes}
              periods={periods}
              settings={settings}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onBatchDeleteSchedules={handleBatchDeleteSchedules}
            />
          )}

          {currentMenu === 'absensi' && (
            <AttendanceView
              students={students}
              classes={classes}
              periods={periods}
              settings={settings}
              existingAttendance={attendance}
              onSaveAttendanceBatch={handleSaveAttendanceBatch}
              onBatchDeleteAttendance={handleBatchDeleteAttendance}
            />
          )}

          {currentMenu === 'jurnal' && (
            <JournalView
              journals={journals}
              classes={classes}
              periods={periods}
              settings={settings}
              onSaveJournal={handleSaveJournal}
              onDeleteJournal={handleDeleteJournal}
              onBatchDeleteJournals={handleBatchDeleteJournals}
            />
          )}

          {currentMenu === 'nilai_pengetahuan' && (
            <KnowledgeAssessmentView
              students={students}
              classes={classes}
              settings={settings}
              existingAssessments={knowledgeAssessments}
              onSaveAssessmentBatch={handleSaveKnowledgeBatch}
              onDeleteAssessment={handleDeleteKnowledge}
              onBatchDeleteAssessments={handleBatchDeleteKnowledge}
            />
          )}

          {currentMenu === 'nilai_keterampilan' && (
            <SkillAssessmentView
              students={students}
              classes={classes}
              settings={settings}
              existingAssessments={skillAssessments}
              onSaveAssessmentBatch={handleSaveSkillBatch}
              onDeleteAssessment={handleDeleteSkill}
              onBatchDeleteAssessments={handleBatchDeleteSkills}
            />
          )}

          {currentMenu === 'nilai_sikap' && (
            <AttitudeAssessmentView
              students={students}
              classes={classes}
              settings={settings}
              existingAssessments={attitudeAssessments}
              onSaveAssessmentBatch={handleSaveAttitudeBatch}
              onDeleteAssessment={handleDeleteAttitude}
              onBatchDeleteAssessments={handleBatchDeleteAttitude}
            />
          )}

          {currentMenu === 'pendampingan' && (
            <MentoringJournalView
              journals={mentoringJournals}
              students={students}
              classes={classes}
              settings={settings}
              onSaveJournal={handleSaveMentoringJournal}
              onDeleteJournal={handleDeleteMentoringJournal}
              onBatchDeleteJournals={handleBatchDeleteMentoring}
              onResetDefaultJournals={() => {
                resetMentoringJournals();
                setMentoringJournals(getMentoringJournals());
              }}
            />
          )}

          {currentMenu === 'refleksi' && (
            <ReflectionCardView
              reflections={reflections}
              students={students}
              classes={classes}
              settings={settings}
              onSaveReflection={handleSaveReflection}
              onDeleteReflection={handleDeleteReflection}
              onBatchDeleteReflections={handleBatchDeleteReflections}
            />
          )}

          {currentMenu === 'rekap_absensi' && (
            <AttendanceRecapView
              students={students}
              classes={classes}
              attendance={attendance}
              settings={settings}
            />
          )}

          {currentMenu === 'rekap_jurnal' && (
            <JournalRecapView
              journals={journals}
              classes={classes}
              settings={settings}
            />
          )}

          {currentMenu === 'rekap_nilai' && (
            <GradesRecapView
              students={students}
              classes={classes}
              knowledgeAssessments={knowledgeAssessments}
              skillAssessments={skillAssessments}
              attitudeAssessments={attitudeAssessments}
              settings={settings}
            />
          )}

          {currentMenu === 'pengaturan' && (
            <SettingsView
              settings={settings}
              classes={classes}
              periods={periods}
              onSaveSettings={handleSaveSettings}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onSavePeriods={handleSavePeriods}
            />
          )}
        </main>
      </div>
    </div>
  );
}
