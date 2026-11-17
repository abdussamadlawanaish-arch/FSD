import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  UserCheck,
  Shield,
  GraduationCap,
  KeyRound,
  UserPlus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  AdminAccount,
  AuthMode,
  AuthSession,
  InstructorAccount,
  STAFF_ACCESS_CODES,
  StudentRecord,
  UserRole,
} from '../types';
import { BrandLogo } from './BrandLogo';

interface LoginModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  initialRole?: UserRole;
  students: StudentRecord[];
  instructors: InstructorAccount[];
  admins: AdminAccount[];
  logoUrl: string;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
  onCreateInstructor: (account: Omit<InstructorAccount, 'id' | 'createdAt'>) => void;
  onCreateAdmin: (account: Omit<AdminAccount, 'id' | 'createdAt'>) => void;
  onGoToStudentRegistration: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  initialMode = 'signin',
  initialRole = 'student',
  students,
  instructors,
  admins,
  logoUrl,
  onClose,
  onLoginSuccess,
  onCreateInstructor,
  onCreateAdmin,
  onGoToStudentRegistration,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [roleTab, setRoleTab] = useState<UserRole>(initialRole);

  // Sign In state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [quickFillNotice, setQuickFillNotice] = useState('');

  // Instructor / Admin Sign Up state
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('Class B, Class C');
  const [accessCode, setAccessCode] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setRoleTab(initialRole);
      setError('');
      setQuickFillNotice('');
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError('');
    setQuickFillNotice('');
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    resetMessages();
  };

  const handleRoleChange = (role: UserRole) => {
    setRoleTab(role);
    setIdentifier('');
    setPassword('');
    resetMessages();
  };

  const handleQuickFillDemo = (role: UserRole) => {
    setAuthMode('signin');
    setRoleTab(role);
    setError('');

    if (role === 'student') {
      const demoStudent = students[0];
      if (demoStudent) {
        setIdentifier(demoStudent.nin);
        setPassword(demoStudent.password);
        setQuickFillNotice(
          `Filled demo Student credentials (${demoStudent.fullName}). Click Sign In below.`
        );
      }
    } else if (role === 'instructor') {
      const demoInst = instructors[0];
      if (demoInst) {
        setIdentifier(demoInst.email);
        setPassword(demoInst.password);
        setQuickFillNotice(
          `Filled demo Instructor credentials (${demoInst.fullName}). Click Sign In below.`
        );
      }
    } else {
      const demoAdmin = admins[0];
      if (demoAdmin) {
        setIdentifier(demoAdmin.email);
        setPassword(demoAdmin.password);
        setQuickFillNotice(
          `Filled demo Admin credentials (${demoAdmin.fullName}). Click Sign In below.`
        );
      }
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const idTrimmed = identifier.trim();
    const passTrimmed = password.trim();

    if (roleTab === 'admin') {
      const matchedAdmin = admins.find(
        (a) => a.email.toLowerCase() === idTrimmed.toLowerCase() && a.password === passTrimmed
      );
      if (!matchedAdmin) {
        setError(
          'Invalid Admin email or password. Use Quick Fill Demo Login or create an Admin account.'
        );
        return;
      }
      onLoginSuccess({
        role: 'admin',
        displayName: matchedAdmin.fullName,
        email: matchedAdmin.email,
        phone: matchedAdmin.phone,
      });
      return;
    }

    if (roleTab === 'instructor') {
      const matchedInst = instructors.find(
        (i) => i.email.toLowerCase() === idTrimmed.toLowerCase() && i.password === passTrimmed
      );
      if (!matchedInst) {
        setError(
          'Invalid Instructor email or password. Use Quick Fill Demo Login or create an Instructor account.'
        );
        return;
      }
      onLoginSuccess({
        role: 'instructor',
        displayName: matchedInst.fullName,
        staffId: matchedInst.staffId,
        email: matchedInst.email,
        specialty: matchedInst.specialty,
        phone: matchedInst.phone,
      });
      return;
    }

    // Student login by NIN or Student ID + Password
    const matchedStudent = students.find(
      (s) =>
        (s.nin.trim() === idTrimmed || s.id.toLowerCase() === idTrimmed.toLowerCase()) &&
        s.password === passTrimmed
    );

    if (!matchedStudent) {
      setError(
        'No matching student account found. Check your NIN Number (or Student ID) and password.'
      );
      return;
    }

    onLoginSuccess({
      role: 'student',
      studentId: matchedStudent.id,
      displayName: matchedStudent.fullName,
    });
  };

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (signupPassword.trim().length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (roleTab === 'instructor') {
      if (accessCode.trim().toUpperCase() !== STAFF_ACCESS_CODES.instructor) {
        setError(
          `Invalid Staff Access Code. Enter "${STAFF_ACCESS_CODES.instructor}" for Instructor registration.`
        );
        return;
      }

      if (instructors.some((i) => i.email.toLowerCase() === cleanEmail)) {
        setError('An Instructor account with this email address already exists. Please Sign In.');
        return;
      }

      if (instructors.some((i) => i.staffId.toLowerCase() === staffId.trim().toLowerCase())) {
        setError('This Staff / Instructor ID is already registered.');
        return;
      }

      onCreateInstructor({
        fullName: fullName.trim(),
        staffId: staffId.trim().toUpperCase(),
        email: cleanEmail,
        phone: phone.trim(),
        specialty: specialty.trim(),
        password: signupPassword.trim(),
      });
      return;
    }

    if (roleTab === 'admin') {
      if (accessCode.trim().toUpperCase() !== STAFF_ACCESS_CODES.admin) {
        setError(
          `Invalid Admin Authorization Code. Enter "${STAFF_ACCESS_CODES.admin}" for Admin registration.`
        );
        return;
      }

      if (admins.some((a) => a.email.toLowerCase() === cleanEmail)) {
        setError('An Admin account with this email address already exists. Please Sign In.');
        return;
      }

      onCreateAdmin({
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password: signupPassword.trim(),
      });
    }
  };

  const demoStudent = students[0];
  const demoInstructor = instructors[0];
  const demoAdmin = admins[0];

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Portal Authentication"
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl my-4">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#0A2E7A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <BrandLogo
              logoUrl={logoUrl}
              className="h-9 w-auto object-contain bg-white rounded-md p-0.5"
            />
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">
                FUSAHA DRIVING SCHOOL Portal Access
              </h2>
              <p className="text-xs text-slate-200">
                Sign In or Create Account for Student, Instructor, and Admin Portals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sign In / Create Account Switcher */}
            <div className="flex items-center rounded-lg bg-white/15 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  authMode === 'signin'
                    ? 'bg-[#F5B700] text-[#0A2E7A] font-bold'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  authMode === 'signup'
                    ? 'bg-[#F5B700] text-[#0A2E7A] font-bold'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Create Account
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close portal modal"
              className="rounded-lg p-1.5 text-slate-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Auth Form */}
          <div className="p-6 md:col-span-7 border-b md:border-b-0 md:border-r border-slate-200">
            {/* Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  roleTab === 'student'
                    ? 'bg-[#0A2E7A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('instructor')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  roleTab === 'instructor'
                    ? 'bg-[#0A2E7A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Instructor</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  roleTab === 'admin'
                    ? 'bg-[#0A2E7A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </button>
            </div>

            {authMode === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {roleTab === 'student'
                      ? 'NIN Number or Student ID'
                      : 'Registered Email Address'}
                  </label>
                  <input
                    type={roleTab === 'student' ? 'text' : 'email'}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      roleTab === 'student'
                        ? 'e.g. 23456789012 or FDS-2026-001'
                        : roleTab === 'instructor'
                        ? 'instructor@fusaha.com'
                        : 'admin@fusaha.com'
                    }
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Portal Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                {quickFillNotice && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span>{quickFillNotice}</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A2E7A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#082361] transition-colors cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-[#F5B700]" />
                  <span>
                    Sign In to{' '}
                    {roleTab === 'student'
                      ? 'Student Portal'
                      : roleTab === 'instructor'
                      ? 'Instructor Portal'
                      : 'Admin Dashboard'}
                  </span>
                </button>

                <div className="pt-1 text-center text-xs text-slate-500">
                  Need a new {roleTab} account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-semibold text-[#0A2E7A] hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : roleTab === 'student' ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0A2E7A]">
                  <GraduationCap className="h-5 w-5" />
                  <span>Student Account Registration</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Student accounts are created directly in our main Online Student Registration
                  Form, where you select your Course Package, Payment Plan (75% Deposit or 100%
                  Full), License Class, NIN Number, and Portal Password—and receive an instant
                  printable Admission &amp; Payment Pass.
                </p>
                <button
                  type="button"
                  onClick={onGoToStudentRegistration}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A2E7A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#082361] transition-colors cursor-pointer"
                >
                  <span>Go to Student Registration Form</span>
                  <ArrowRight className="h-4 w-4 text-[#F5B700]" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAccountSubmit} className="mt-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={roleTab === 'admin' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={
                        roleTab === 'instructor' ? 'e.g. Malam Yusuf Kano' : 'e.g. Hauwa Ibrahim'
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                    />
                  </div>

                  {roleTab === 'instructor' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Staff / Instructor ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        placeholder="e.g. INST-FDS-002"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@fusaha.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08030435429"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                    />
                  </div>

                  {roleTab === 'instructor' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Driving License Specialty *
                      </label>
                      <input
                        type="text"
                        required
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="e.g. Class B, Class C, Class E"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {roleTab === 'instructor'
                        ? 'Staff Access Code *'
                        : 'Admin Authorization Code *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder={
                        roleTab === 'instructor' ? 'Enter Staff Access Code' : 'Enter Admin Auth Code'
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Testing hint: Use code{' '}
                      <span className="font-mono-tabular font-bold text-[#0A2E7A]">
                        {roleTab === 'instructor'
                          ? STAFF_ACCESS_CODES.instructor
                          : STAFF_ACCESS_CODES.admin}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={5}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 5 characters"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={5}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A2E7A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#082361] transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-[#F5B700]" />
                  <span>
                    Create {roleTab === 'instructor' ? 'Instructor' : 'Admin'} Account &amp; Sign In
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Quick Fill Demo Login Panel (1 Pre-Loaded Demo Account per Role) */}
          <div className="bg-slate-50 p-6 md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
                <KeyRound className="h-4 w-4 text-[#D99B00]" />
                <span>Quick Fill Demo Login</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Click any button below to auto-fill a pre-loaded demo account for effortless
                testing.
              </p>

              <div className="mt-4 space-y-3">
                {/* 1. Student Demo Account */}
                {demoStudent && (
                  <button
                    type="button"
                    onClick={() => handleQuickFillDemo('student')}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#0A2E7A] hover:bg-[#0A2E7A]/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A2E7A]">
                        Quick Fill Demo: Student
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-[#0A2E7A]">
                        Fill Form →
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-900">
                      {demoStudent.fullName}
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-[11px] text-slate-600">
                      NIN: {demoStudent.nin} · Pass: {demoStudent.password}
                    </div>
                  </button>
                )}

                {/* 2. Instructor Demo Account */}
                {demoInstructor && (
                  <button
                    type="button"
                    onClick={() => handleQuickFillDemo('instructor')}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#0A2E7A] hover:bg-[#0A2E7A]/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A2E7A]">
                        Quick Fill Demo: Instructor
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-[#0A2E7A]">
                        Fill Form →
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-900">
                      {demoInstructor.fullName} ({demoInstructor.staffId})
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-[11px] text-slate-600">
                      {demoInstructor.email} · Pass: {demoInstructor.password}
                    </div>
                  </button>
                )}

                {/* 3. Admin Demo Account */}
                {demoAdmin && (
                  <button
                    type="button"
                    onClick={() => handleQuickFillDemo('admin')}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#0A2E7A] hover:bg-[#0A2E7A]/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A2E7A]">
                        Quick Fill Demo: Admin
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-[#0A2E7A]">
                        Fill Form →
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-900">
                      {demoAdmin.fullName}
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-[11px] text-slate-600">
                      {demoAdmin.email} · Pass: {demoAdmin.password}
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              All newly created Student, Instructor, and Admin accounts are saved directly to{' '}
              <span className="font-mono-tabular">localStorage</span> and persist across sign-outs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
