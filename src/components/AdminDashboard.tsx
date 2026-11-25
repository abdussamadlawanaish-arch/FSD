import React, { useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ImagePlus,
  LogOut,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Shield,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  AdminAccount,
  AuthSession,
  COURSE_PACKAGES,
  DEFAULT_LOGO_PATH,
  InstructorAccount,
  PrintableDocType,
  SCHOOL_INFO,
  StudentRecord,
  formatNaira,
  isFrscEligible,
  isFullyPaid,
} from '../types';
import { BrandLogo } from './BrandLogo';

type AdminFilter = 'all' | 'pending_initial' | 'deposit_75' | 'fully_paid' | 'frsc_ready';

interface AdminDashboardProps {
  session: AuthSession;
  students: StudentRecord[];
  instructors: InstructorAccount[];
  admins: AdminAccount[];
  logoUrl: string;
  onUpdateLogo: (newLogoDataUrl: string | null) => Promise<void>;
  onVerifyPayment: (studentId: string, verifyAction: 'initial' | 'final_25') => Promise<void>;
  onOpenDocument: (student: StudentRecord, docType: PrintableDocType) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  students,
  instructors,
  admins,
  logoUrl,
  onUpdateLogo,
  onVerifyPayment,
  onOpenDocument,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<AdminFilter>('all');
  const [statusNotice, setStatusNotice] = useState('');

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusNotice('Please select a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          await onUpdateLogo(reader.result);
          setStatusNotice(
            'Official School Logo synced across all foreground headers, watermarks, passes, receipts, and FRSC clearances.'
          );
          setTimeout(() => setStatusNotice(''), 4500);
        } catch (err) {
          setStatusNotice((err as Error).message || 'Could not update school logo.');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetLogo = async () => {
    try {
      await onUpdateLogo(null);
      setStatusNotice('Restored the official default FUSAHA DRIVING SCHOOL emblem.');
      setTimeout(() => setStatusNotice(''), 3500);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Could not reset school logo.');
    }
  };

  const handleVerifyInitialPayment = async (student: StudentRecord) => {
    try {
      await onVerifyPayment(student.id, 'initial');
      setStatusNotice(
        `Verified initial GTBank payment (${formatNaira(student.initialAmountDue)}) for ${
          student.fullName
        }.`
      );
      setTimeout(() => setStatusNotice(''), 3500);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Could not verify initial payment.');
    }
  };

  const handleVerifyFinal25Balance = async (student: StudentRecord) => {
    try {
      await onVerifyPayment(student.id, 'final_25');
      setStatusNotice(
        `Cleared final 25% balance for ${student.fullName}. Full tuition (${formatNaira(
          student.totalFee
        )}) is now 100% verified.`
      );
      setTimeout(() => setStatusNotice(''), 3500);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Could not clear final balance.');
    }
  };

  // KPIs
  const totalCollected = students.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalOutstanding = students.reduce(
    (acc, s) => acc + Math.max(0, s.totalFee - s.amountPaid),
    0
  );
  const frscReadyCount = students.filter((s) => isFrscEligible(s)).length;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.nin.includes(q);

    if (!matchesSearch) return false;

    if (filter === 'pending_initial') return !s.initialDepositVerified;
    if (filter === 'deposit_75')
      return s.initialDepositVerified && !isFullyPaid(s);
    if (filter === 'fully_paid') return isFullyPaid(s);
    if (filter === 'frsc_ready') return isFrscEligible(s);
    return true;
  });

  const isCustomLogo = logoUrl !== DEFAULT_LOGO_PATH;

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Admin Header with Logged-In Admin Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#0A2E7A]/20 bg-white/95 p-6 shadow-xs">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
            Admin Dashboard · {SCHOOL_INFO.name}
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome, {session.displayName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>Role: <strong className="text-[#0A2E7A]">School Administrator</strong></span>
            {session.email && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{session.email}</span>
              </>
            )}
            {session.phone && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{session.phone}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-center whitespace-nowrap"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {statusNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800">
          {statusNotice}
        </div>
      )}

      {/* School Branding Settings: Logo Uploader */}
      <div className="rounded-2xl border border-[#0A2E7A]/25 bg-white/95 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center shrink-0">
              <BrandLogo logoUrl={logoUrl} className="max-h-16 w-auto object-contain" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
                School Branding Settings
              </div>
              <h2 className="mt-0.5 font-display text-lg font-extrabold text-slate-900">
                Official School Logo &amp; Watermark Sync
              </h2>
              <p className="mt-1 text-xs text-slate-600 max-w-xl">
                Upload an official logo image file to immediately update the top navigation bar,
                hero emblem, background page watermark, Admission Passes, Tuition Receipts, and
                FRSC Clearances.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E7A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#082361] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ImagePlus className="h-4 w-4 text-[#F5B700]" />
              <span>Upload Official School Logo</span>
            </button>

            {isCustomLogo && (
              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Default</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Registered Students</div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-extrabold text-[#0A2E7A]">
            {students.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Active &amp; alumni records</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Verified Tuition Collected</div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-extrabold text-emerald-700">
            {formatNaira(totalCollected)}
          </div>
          <div className="mt-1 text-xs text-slate-500">GTBank confirmed receipts</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Outstanding Tuition</div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-extrabold text-amber-700">
            {formatNaira(totalOutstanding)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Pending deposits &amp; 25% balances</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">FRSC Clearances Ready</div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-extrabold text-[#0A2E7A]">
            {frscReadyCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">100% paid + 1-month completed</div>
        </div>
      </div>

      {/* Student Roster & Payment Verification Table */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: 'all' as AdminFilter, label: 'All Students' },
              { id: 'pending_initial' as AdminFilter, label: 'Awaiting Payment' },
              { id: 'deposit_75' as AdminFilter, label: '75% Deposit Active' },
              { id: 'fully_paid' as AdminFilter, label: '100% Paid' },
              { id: 'frsc_ready' as AdminFilter, label: 'FRSC Cleared' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-[#0A2E7A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, NIN, or ID..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-bold">Student &amp; NIN</th>
                <th className="px-4 py-3 font-bold">Package &amp; Plan</th>
                <th className="px-4 py-3 font-bold text-right">Paid / Balance</th>
                <th className="px-4 py-3 font-bold">Training &amp; Payment Status</th>
                <th className="px-4 py-3 font-bold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No student records match the current filter or search term.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const pkg = COURSE_PACKAGES[st.packageId];
                  const balance = Math.max(0, st.totalFee - st.amountPaid);
                  const fullyPaid = isFullyPaid(st);
                  const frscReady = isFrscEligible(st);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-bold text-slate-900 text-sm">{st.fullName}</div>
                        <div className="mt-0.5 font-mono-tabular text-slate-600">
                          {st.id} · NIN: {st.nin}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{st.licenseClass}</div>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="font-semibold text-slate-900">{pkg.title}</div>
                        <div className="mt-0.5 text-slate-600">
                          {st.paymentPlan === 'deposit_75'
                            ? '75% Deposit Plan'
                            : '100% Full Payment Plan'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top text-right font-mono-tabular">
                        <div className="font-bold text-emerald-700">
                          Paid: {formatNaira(st.amountPaid)}
                        </div>
                        <div
                          className={`mt-0.5 font-semibold ${
                            balance > 0 ? 'text-amber-700' : 'text-slate-500'
                          }`}
                        >
                          Bal: {formatNaira(balance)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {fullyPaid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>100% Tuition Verified</span>
                            </span>
                          ) : st.initialDepositVerified ? (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>75% Verified · 25% Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Initial Transfer Unverified</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Training:{' '}
                          <strong
                            className={
                              st.oneMonthTrainingCompleted ? 'text-emerald-700' : 'text-slate-700'
                            }
                          >
                            {st.oneMonthTrainingCompleted
                              ? '1-Month Completed'
                              : `${st.attendanceSessions}/${st.totalRequiredSessions} Sessions`}
                          </strong>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {!st.initialDepositVerified && (
                            <button
                              type="button"
                              onClick={() => handleVerifyInitialPayment(st)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0A2E7A] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#082361] cursor-pointer whitespace-nowrap"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-[#F5B700]" />
                              <span>
                                Verify {formatNaira(st.initialAmountDue)}
                              </span>
                            </button>
                          )}

                          {st.initialDepositVerified &&
                            st.paymentPlan === 'deposit_75' &&
                            !st.finalBalanceVerified && (
                              <button
                                type="button"
                                onClick={() => handleVerifyFinal25Balance(st)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 cursor-pointer whitespace-nowrap"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Clear 25% (₦16,250)</span>
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenDocument(st, 'tuition_receipt')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 hover:border-[#0A2E7A] cursor-pointer whitespace-nowrap"
                          >
                            <Receipt className="h-3.5 w-3.5 text-[#0A2E7A]" />
                            <span>Issue / Print Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDocument(st, 'admission_pass')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 hover:border-[#0A2E7A] cursor-pointer whitespace-nowrap"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-600" />
                            <span>Pass</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDocument(st, 'frsc_clearance')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold cursor-pointer whitespace-nowrap ${
                              frscReady
                                ? 'bg-[#F5B700] text-[#0A2E7A] hover:bg-[#e5ab00]'
                                : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>FRSC Clearance</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff & Account Directory (Registered Admin & Instructor Accounts) */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
              Staff &amp; Account Directory
            </div>
            <h2 className="mt-0.5 font-display text-lg font-extrabold text-slate-900">
              Registered Administrator &amp; Instructor Accounts ({admins.length + instructors.length})
            </h2>
          </div>
          <div className="text-xs text-slate-500">Synced across devices</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Instructor Accounts */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A2E7A]">
                <UserCheck className="h-4 w-4" />
                <span>Registered Instructors ({instructors.length})</span>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {instructors.map((inst) => (
                <div key={inst.id} className="px-4 py-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{inst.fullName}</div>
                    <div className="mt-0.5 font-mono-tabular text-slate-600">
                      ID: {inst.staffId} · {inst.email}
                    </div>
                    <div className="mt-0.5 text-slate-500">
                      Specialty: {inst.specialty} · Tel: <span className="font-mono-tabular">{inst.phone}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono-tabular text-slate-400 shrink-0">
                    {new Date(inst.createdAt).toLocaleDateString('en-NG')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Accounts */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A2E7A]">
                <Shield className="h-4 w-4" />
                <span>Registered Administrators ({admins.length})</span>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {admins.map((adm) => (
                <div key={adm.id} className="px-4 py-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{adm.fullName}</div>
                    <div className="mt-0.5 font-mono-tabular text-slate-600">{adm.email}</div>
                    <div className="mt-0.5 text-slate-500">
                      Tel: <span className="font-mono-tabular">{adm.phone}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono-tabular text-slate-400 shrink-0">
                    {new Date(adm.createdAt).toLocaleDateString('en-NG')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
