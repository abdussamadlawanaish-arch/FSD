import React, { useState } from 'react';
import { X, Lock, UserCheck, Shield, GraduationCap, ArrowRight, KeyRound } from 'lucide-react';
import { AuthSession, StudentRecord, UserRole, formatNaira } from '../types';
import { BrandLogo } from './BrandLogo';

interface LoginModalProps {
  isOpen: boolean;
  initialRole?: UserRole;
  students: StudentRecord[];
  logoUrl: string;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  initialRole = 'student',
  students,
  logoUrl,
  onClose,
  onLoginSuccess,
}) => {
  const [roleTab, setRoleTab] = useState<UserRole>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (nextRole: UserRole) => {
    setRoleTab(nextRole);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const idTrimmed = identifier.trim();
    const passTrimmed = password.trim();

    if (roleTab === 'admin') {
      if (idTrimmed.toLowerCase() === 'admin@fusaha.com' && passTrimmed === 'admin123') {
        onLoginSuccess({ role: 'admin', displayName: 'School Administrator' });
        return;
      }
      setError('Invalid Admin credentials. Use admin@fusaha.com / admin123 or Quick Demo Login.');
      return;
    }

    if (roleTab === 'instructor') {
      if (idTrimmed.toLowerCase() === 'instructor@fusaha.com' && passTrimmed === 'inst123') {
        onLoginSuccess({ role: 'instructor', displayName: 'Chief Driving Instructor' });
        return;
      }
      setError(
        'Invalid Instructor credentials. Use instructor@fusaha.com / inst123 or Quick Demo Login.'
      );
      return;
    }

    // Student login by NIN or Student ID + Password
    const matched = students.find(
      (s) =>
        (s.nin.trim() === idTrimmed || s.id.toLowerCase() === idTrimmed.toLowerCase()) &&
        s.password === passTrimmed
    );

    if (!matched) {
      setError(
        'No matching student found. Please check your NIN Number (or Student ID) and portal password.'
      );
      return;
    }

    onLoginSuccess({
      role: 'student',
      studentId: matched.id,
      displayName: matched.fullName,
    });
  };

  const demoStudents = students.slice(0, 2);

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Portal Login"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A2E7A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <BrandLogo logoUrl={logoUrl} className="h-9 w-auto object-contain bg-white rounded-md p-0.5" />
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">
                FUSAHA DRIVING SCHOOL Portal Login
              </h2>
              <p className="text-xs text-slate-200">
                Sign in as Student, Instructor, or Administrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login modal"
            className="rounded-lg p-1.5 text-slate-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Auth Form */}
          <div className="p-6 md:col-span-7 border-b md:border-b-0 md:border-r border-slate-200">
            {/* Role Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleTabChange('student')}
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
                onClick={() => handleTabChange('instructor')}
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
                onClick={() => handleTabChange('admin')}
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {roleTab === 'student'
                    ? 'NIN Number or Student ID'
                    : 'Staff Email / Username'}
                </label>
                <input
                  type="text"
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
            </form>
          </div>

          {/* Right: Quick Demo Login Panel */}
          <div className="bg-slate-50 p-6 md:col-span-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
              <KeyRound className="h-4 w-4 text-[#D99B00]" />
              <span>Quick Demo Login</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Click any demo account below for instant access, or copy the credentials to test.
            </p>

            <div className="mt-4 space-y-2.5">
              {/* Admin Demo */}
              <button
                type="button"
                onClick={() =>
                  onLoginSuccess({ role: 'admin', displayName: 'School Administrator' })
                }
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-[#0A2E7A] hover:bg-[#0A2E7A]/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A2E7A]">Admin Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0A2E7A]" />
                </div>
                <div className="mt-1 font-mono-tabular text-[11px] text-slate-600">
                  admin@fusaha.com · Pass: admin123
                </div>
              </button>

              {/* Instructor Demo */}
              <button
                type="button"
                onClick={() =>
                  onLoginSuccess({ role: 'instructor', displayName: 'Chief Driving Instructor' })
                }
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-[#0A2E7A] hover:bg-[#0A2E7A]/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A2E7A]">Instructor Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0A2E7A]" />
                </div>
                <div className="mt-1 font-mono-tabular text-[11px] text-slate-600">
                  instructor@fusaha.com · Pass: inst123
                </div>
              </button>

              {/* Pre-loaded Demo Students */}
              <div className="pt-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Demo Student Accounts
                </div>
                <div className="space-y-2">
                  {demoStudents.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        onLoginSuccess({
                          role: 'student',
                          studentId: st.id,
                          displayName: st.fullName,
                        })
                      }
                      className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-[#0A2E7A] hover:bg-[#0A2E7A]/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate pr-2">
                          {st.fullName}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-[#0A2E7A]" />
                      </div>
                      <div className="mt-1 font-mono-tabular text-[11px] text-slate-600">
                        NIN: {st.nin} · ID: {st.id}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {st.oneMonthTrainingCompleted
                          ? `100% Paid (${formatNaira(st.amountPaid)}) · FRSC Cleared`
                          : `75% Deposit (${formatNaira(st.amountPaid)} paid) · Pass: ${st.password}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
