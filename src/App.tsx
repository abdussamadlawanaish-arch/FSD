import React, { useState } from 'react';
import { Lock, LogOut, Menu, X } from 'lucide-react';
import {
  AuthSession,
  PrintableDocType,
  SCHOOL_INFO,
  StudentRecord,
} from './types';
import {
  generateNextStudentId,
  loadLogoUrl,
  loadSession,
  loadStudents,
  saveLogoUrl,
  saveSession,
  saveStudents,
} from './storage';
import { BrandLogo, GlobalPageWatermark } from './components/BrandLogo';
import { LandingAndRegistration } from './components/LandingAndRegistration';
import { LoginModal } from './components/LoginModal';
import { StudentPortal } from './components/StudentPortal';
import { InstructorPortal } from './components/InstructorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { PrintableDocumentModal } from './components/PrintableDocuments';

export default function App() {
  const [students, setStudents] = useState<StudentRecord[]>(() => loadStudents());
  const [logoUrl, setLogoUrl] = useState<string>(() => loadLogoUrl());
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<{
    student: StudentRecord;
    docType: PrintableDocType;
  } | null>(null);

  const handleUpdateStudents = (nextStudents: StudentRecord[]) => {
    setStudents(nextStudents);
    saveStudents(nextStudents);
  };

  const handleUpdateStudent = (updated: StudentRecord) => {
    const next = students.map((s) => (s.id === updated.id ? updated : s));
    handleUpdateStudents(next);
    if (activeDocument && activeDocument.student.id === updated.id) {
      setActiveDocument({ ...activeDocument, student: updated });
    }
  };

  const handleUpdateLogo = (dataUrl: string | null) => {
    const resolved = saveLogoUrl(dataUrl);
    setLogoUrl(resolved);
  };

  const handleLoginSuccess = (nextSession: AuthSession) => {
    setSession(nextSession);
    saveSession(nextSession);
    setLoginModalOpen(false);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setSession(null);
    saveSession(null);
    setActiveDocument(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterStudent: React.ComponentProps<
    typeof LandingAndRegistration
  >['onRegisterStudent'] = (formData) => {
    const existingWithNin = students.find((s) => s.nin === formData.nin);
    const nextId = generateNextStudentId(students);
    const suffix = nextId.split('-').pop() || '001';

    const newStudent: StudentRecord = {
      ...formData,
      id: nextId,
      receiptNumber: `RCT-${nextId}`,
      clearanceNumber: `FRSC-JIG-FDS-${suffix}`,
      registeredAt: new Date().toISOString(),
      amountPaid: 0,
      initialDepositVerified: false,
      finalBalanceVerified: false,
      attendanceSessions: 0,
      totalRequiredSessions: 20,
      theoryScore: 0,
      practicalScores: {
        steering: 0,
        parking: 0,
        roadSigns: 0,
        defensiveDriving: 0,
      },
      instructorFeedback:
        'Newly enrolled student. Present your Admission & Payment Pass with GTBank receipt at the Dutse campus office to begin physical training.',
      oneMonthTrainingCompleted: false,
    };

    const nextList = existingWithNin
      ? [newStudent, ...students.filter((s) => s.id !== existingWithNin.id)]
      : [newStudent, ...students];

    handleUpdateStudents(nextList);

    const newSession: AuthSession = {
      role: 'student',
      studentId: newStudent.id,
      displayName: newStudent.fullName,
    };
    setSession(newSession);
    saveSession(newSession);

    // Immediately show the printable Admission & Payment Pass
    setActiveDocument({ student: newStudent, docType: 'admission_pass' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentStudent =
    session?.role === 'student'
      ? students.find((s) => s.id === session.studentId) || null
      : null;

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Centered Global Website Background Logo Watermark */}
      <GlobalPageWatermark logoUrl={logoUrl} />

      {/* Top Navigation Bar (Clean 3-Zone Contract) */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark + Foreground Logo */}
          <a
            href="#home"
            onClick={(e) => {
              if (session) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <BrandLogo logoUrl={logoUrl} className="h-10 w-auto object-contain" />
            <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#0A2E7A]">
              {SCHOOL_INFO.name}
            </span>
          </a>

          {/* Zone 2: Concise Single-Line Nav Links */}
          {!session ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <a
                href="#home"
                className="hover:text-[#0A2E7A] transition-colors whitespace-nowrap shrink-0"
              >
                Home
              </a>
              <a
                href="#programs"
                className="hover:text-[#0A2E7A] transition-colors whitespace-nowrap shrink-0"
              >
                Programs
              </a>
              <a
                href="#enroll"
                className="hover:text-[#0A2E7A] transition-colors whitespace-nowrap shrink-0"
              >
                Register Now
              </a>
              <a
                href="#bank-details"
                className="hover:text-[#0A2E7A] transition-colors whitespace-nowrap shrink-0"
              >
                GTBank Payment
              </a>
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-slate-600 whitespace-nowrap shrink-0">
              <span className="text-[#0A2E7A] font-bold uppercase tracking-wider">
                {session.role === 'admin'
                  ? 'Admin Console'
                  : session.role === 'instructor'
                  ? 'Instructor Portal'
                  : 'Student Portal'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[220px]">{session.displayName}</span>
            </div>
          )}

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {!session ? (
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E7A] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#082361] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Lock className="h-3.5 w-3.5 text-[#F5B700]" />
                <span>Portal Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            )}

            {!session && (
              <button
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                className="md:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {!session && mobileNavOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2 text-sm font-semibold text-slate-700">
            <a
              href="#home"
              onClick={() => setMobileNavOpen(false)}
              className="py-1.5 hover:text-[#0A2E7A]"
            >
              Home
            </a>
            <a
              href="#programs"
              onClick={() => setMobileNavOpen(false)}
              className="py-1.5 hover:text-[#0A2E7A]"
            >
              Programs
            </a>
            <a
              href="#enroll"
              onClick={() => setMobileNavOpen(false)}
              className="py-1.5 hover:text-[#0A2E7A]"
            >
              Register Now
            </a>
            <a
              href="#bank-details"
              onClick={() => setMobileNavOpen(false)}
              className="py-1.5 hover:text-[#0A2E7A]"
            >
              GTBank Payment
            </a>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="no-print flex-1">
        {!session && (
          <LandingAndRegistration
            logoUrl={logoUrl}
            onOpenLogin={() => setLoginModalOpen(true)}
            onRegisterStudent={handleRegisterStudent}
          />
        )}

        {session?.role === 'student' && currentStudent && (
          <StudentPortal
            student={currentStudent}
            onOpenDocument={(student, docType) => setActiveDocument({ student, docType })}
            onLogout={handleLogout}
          />
        )}

        {session?.role === 'instructor' && (
          <InstructorPortal
            students={students}
            onUpdateStudent={handleUpdateStudent}
            onLogout={handleLogout}
          />
        )}

        {session?.role === 'admin' && (
          <AdminDashboard
            students={students}
            logoUrl={logoUrl}
            onUpdateLogo={handleUpdateLogo}
            onUpdateStudent={handleUpdateStudent}
            onOpenDocument={(student, docType) => setActiveDocument({ student, docType })}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Quiet Footer with Foreground Logo */}
      <footer className="no-print relative z-10 border-t border-slate-200 bg-white/95">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <BrandLogo logoUrl={logoUrl} className="h-10 w-auto object-contain" />
            <div>
              <div className="font-display font-bold text-[#0A2E7A]">{SCHOOL_INFO.name}</div>
              <div>{SCHOOL_INFO.address}</div>
            </div>
          </div>

          <div className="text-center sm:text-right space-y-0.5">
            <div className="font-mono-tabular">
              Tel: {SCHOOL_INFO.phone} · Email: {SCHOOL_INFO.email}
            </div>
            <div className="text-slate-500">
              Licensed by {SCHOOL_INFO.licensingAuthority} · © {new Date().getFullYear()}{' '}
              {SCHOOL_INFO.name}
            </div>
          </div>
        </div>
      </footer>

      {/* Role-Based Portal Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        students={students}
        logoUrl={logoUrl}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Printable Document Modal (Admission Pass / Official Tuition Receipt / FRSC Clearance) */}
      {activeDocument && (
        <PrintableDocumentModal
          student={activeDocument.student}
          docType={activeDocument.docType}
          logoUrl={logoUrl}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}
