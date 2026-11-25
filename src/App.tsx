import React, { useCallback, useEffect, useState } from 'react';
import { Lock, LogOut, Menu, UserPlus, X } from 'lucide-react';
import {
  AdminAccount,
  AuthMode,
  AuthSession,
  DEFAULT_LOGO_PATH,
  InstructorAccount,
  PracticalScores,
  PrintableDocType,
  SCHOOL_INFO,
  StudentRecord,
  UserRole,
} from './types';
import { supabase } from './supabaseClient';
import {
  StaffRegistrationPayload,
  fetchSchoolLogo,
  fetchStaffDirectory,
  fetchStudents,
  loginWithCredentials,
  registerStaffAccount,
  updateSchoolLogoInSupabase,
  updateStudentAssessment,
  verifyStudentPayment,
} from './api';
import { BrandLogo, GlobalPageWatermark } from './components/BrandLogo';
import { LandingAndRegistration } from './components/LandingAndRegistration';
import { LoginModal } from './components/LoginModal';
import { StudentPortal } from './components/StudentPortal';
import { InstructorPortal } from './components/InstructorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { PrintableDocumentModal } from './components/PrintableDocuments';

export default function App() {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_PATH);
  const [session, setSession] = useState<AuthSession | null>(null);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [instructors, setInstructors] = useState<InstructorAccount[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);

  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: AuthMode }>({
    isOpen: false,
    mode: 'signin',
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<{
    student: StudentRecord;
    docType: PrintableDocType;
  } | null>(null);

  const syncRoleData = useCallback(async (activeSession: AuthSession) => {
    try {
      const nextStudents = await fetchStudents(activeSession);
      setStudents(nextStudents);
      setActiveDocument((prev) => {
        if (!prev) return null;
        const fresh = nextStudents.find((s) => s.id === prev.student.id);
        return fresh ? { ...prev, student: fresh } : prev;
      });

      if (activeSession.role === 'admin') {
        const staff = await fetchStaffDirectory();
        setInstructors(staff.instructors);
        setAdmins(staff.admins);
      }
    } catch {
      // Retain existing state if transient sync fails
    }
  }, []);

  // Load school logo from Supabase settings table on mount
  useEffect(() => {
    let active = true;
    fetchSchoolLogo()
      .then((nextLogo) => {
        if (active && nextLogo) setLogoUrl(nextLogo);
      })
      .catch(() => {
        // Fallback to default emblem
      });
    return () => {
      active = false;
    };
  }, []);

  // Real-time synchronization directly via @supabase/supabase-js
  useEffect(() => {
    const refreshLogo = () => {
      fetchSchoolLogo()
        .then((nextLogo) => setLogoUrl(nextLogo))
        .catch(() => {});
    };

    const channel = supabase
      .channel('fusaha-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => {
          refreshLogo();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => {
          if (session) {
            void syncRoleData(session);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => {
          if (session?.role === 'admin') {
            void syncRoleData(session);
          }
        }
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      refreshLogo();
      if (session) {
        void syncRoleData(session);
      }
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [session, syncRoleData]);

  const handleSignIn = async (params: {
    role: UserRole;
    identifier: string;
    password: string;
  }) => {
    const result = await loginWithCredentials(params);
    setSession(result.session);
    setAuthModal({ isOpen: false, mode: 'signin' });
    setMobileNavOpen(false);
    await syncRoleData(result.session);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateStaff = async (payload: StaffRegistrationPayload) => {
    const result = await registerStaffAccount(payload);
    setSession(result.session);
    setAuthModal({ isOpen: false, mode: 'signin' });
    setMobileNavOpen(false);
    await syncRoleData(result.session);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutVerified = (verifiedStudent: StudentRecord) => {
    setSession({
      role: 'student',
      studentId: verifiedStudent.id,
      email: verifiedStudent.email,
      displayName: verifiedStudent.fullName,
    });
    setStudents([verifiedStudent]);
    setActiveDocument({ student: verifiedStudent, docType: 'tuition_receipt' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudentPaymentCompleted = (updatedStudent: StudentRecord) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    setActiveDocument({ student: updatedStudent, docType: 'tuition_receipt' });
  };

  const handleLogout = () => {
    setSession(null);
    setStudents([]);
    setInstructors([]);
    setAdmins([]);
    setActiveDocument(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateAssessment = async (
    studentId: string,
    patch: {
      attendanceSessions?: number;
      theoryScore?: number;
      practicalScores?: PracticalScores;
      instructorFeedback?: string;
      oneMonthTrainingCompleted?: boolean;
    }
  ) => {
    const updated = await updateStudentAssessment(studentId, patch);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setActiveDocument((prev) =>
      prev && prev.student.id === updated.id ? { ...prev, student: updated } : prev
    );
  };

  const handleVerifyPayment = async (
    studentId: string,
    verifyAction: 'initial' | 'final_25'
  ) => {
    const updated = await verifyStudentPayment(studentId, verifyAction);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setActiveDocument((prev) =>
      prev && prev.student.id === updated.id ? { ...prev, student: updated } : prev
    );
  };

  const handleUpdateLogo = async (dataUrl: string | null) => {
    const resolved = await updateSchoolLogoInSupabase(dataUrl || '');
    setLogoUrl(resolved);
  };

  const handleGoToStudentRegistration = () => {
    setAuthModal({ isOpen: false, mode: 'signin' });
    setTimeout(() => {
      const el = document.getElementById('enroll');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const currentStudent =
    session?.role === 'student'
      ? students.find((s) => s.id === session.studentId) || null
      : null;

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Centered Global Website Background Logo Watermark */}
      <GlobalPageWatermark logoUrl={logoUrl} />

      {/* Top Navigation Bar */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
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
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
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
                Enrollment
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
                  ? 'Admin Dashboard'
                  : session.role === 'instructor'
                  ? 'Instructor Portal'
                  : 'Student Portal'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[220px]">{session.displayName}</span>
            </div>
          )}

          {/* Zone 3: Account Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!session ? (
              <>
                <button
                  type="button"
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#0A2E7A]/25 bg-white px-3.5 py-2 text-xs font-bold text-[#0A2E7A] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register / Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signin' })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A2E7A] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#082361] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Lock className="h-3.5 w-3.5 text-[#F5B700]" />
                  <span>Portal Sign In</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            {!session && (
              <button
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                className="lg:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {!session && mobileNavOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2 text-sm font-semibold text-slate-700">
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
              Enrollment
            </a>
            <a
              href="#bank-details"
              onClick={() => setMobileNavOpen(false)}
              className="py-1.5 hover:text-[#0A2E7A]"
            >
              GTBank Payment
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                setAuthModal({ isOpen: true, mode: 'signup' });
              }}
              className="py-1.5 text-left font-bold text-[#0A2E7A]"
            >
              Register / Create Account
            </button>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="no-print flex-1">
        {!session && (
          <LandingAndRegistration
            logoUrl={logoUrl}
            onOpenLogin={() => setAuthModal({ isOpen: true, mode: 'signin' })}
            onOpenCreateAccount={() => setAuthModal({ isOpen: true, mode: 'signup' })}
            onCheckoutVerified={handleCheckoutVerified}
          />
        )}

        {session?.role === 'student' && currentStudent && (
          <StudentPortal
            student={currentStudent}
            onOpenDocument={(student, docType) => setActiveDocument({ student, docType })}
            onPaymentCompleted={handleStudentPaymentCompleted}
            onLogout={handleLogout}
          />
        )}

        {session?.role === 'instructor' && (
          <InstructorPortal
            session={session}
            students={students}
            onUpdateAssessment={handleUpdateAssessment}
            onLogout={handleLogout}
          />
        )}

        {session?.role === 'admin' && (
          <AdminDashboard
            session={session}
            students={students}
            instructors={instructors}
            admins={admins}
            logoUrl={logoUrl}
            onUpdateLogo={handleUpdateLogo}
            onVerifyPayment={handleVerifyPayment}
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

      {/* Multi-Role Create Account & Portal Sign-In Modal */}
      <LoginModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        logoUrl={logoUrl}
        onClose={() => setAuthModal({ isOpen: false, mode: 'signin' })}
        onSignIn={handleSignIn}
        onCreateStaff={handleCreateStaff}
        onGoToStudentRegistration={handleGoToStudentRegistration}
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
