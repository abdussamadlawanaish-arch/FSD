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
  Upload,
  FileCheck2,
  Send,
  Trash2,
  Loader2,
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
  isClearedForSchoolCertificate,
  isFrscEligible,
  isFullyPaid,
} from '../types';
import { StudentCertificatePatch } from '../api';
import { BrandLogo } from './BrandLogo';

type AdminFilter = 'all' | 'pending_initial' | 'deposit_75' | 'fully_paid' | 'frsc_ready';
type AdminSectionTab = 'roster' | 'certificates';

interface AdminDashboardProps {
  session: AuthSession;
  students: StudentRecord[];
  instructors: InstructorAccount[];
  admins: AdminAccount[];
  logoUrl: string;
  onUpdateLogo: (newLogoDataUrl: string | null) => Promise<void>;
  onVerifyPayment: (studentId: string, verifyAction: 'initial' | 'final_25') => Promise<void>;
  onUpdateCertificate: (studentId: string, patch: StudentCertificatePatch) => Promise<void>;
  onBulkIssueCertificates: (mode: 'cleared' | 'all') => Promise<number>;
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
  onUpdateCertificate,
  onBulkIssueCertificates,
  onOpenDocument,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<AdminSectionTab>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [filter, setFilter] = useState<AdminFilter>('all');
  const [statusNotice, setStatusNotice] = useState('');
  const [bulkBusy, setBulkBusy] = useState<'idle' | 'cleared' | 'all'>('idle');
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);
  const [frscDrafts, setFrscDrafts] = useState<
    Record<string, { number: string; issueDate: string }>
  >({});

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
        `Verified initial payment (${formatNaira(student.initialAmountDue)}) for ${
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

  const handleToggleSchoolCert = async (student: StudentRecord) => {
    const nextState = !student.schoolCertificateIssued;
    setBusyStudentId(student.id);
    try {
      await onUpdateCertificate(student.id, {
        schoolCertificateIssued: nextState,
      });
      setStatusNotice(
        nextState
          ? `Issued School Driving Certificate and sent portal notification to ${student.fullName}.`
          : `Revoked School Driving Certificate status for ${student.fullName}.`
      );
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Could not update certificate status.');
    } finally {
      setBusyStudentId(null);
    }
  };

  const handleBulkIssue = async (mode: 'cleared' | 'all') => {
    setBulkBusy(mode);
    try {
      const issuedCount = await onBulkIssueCertificates(mode);
      setStatusNotice(
        issuedCount > 0
          ? `Issued School Driving Certificates & sent in-portal notifications to ${issuedCount} ${
              mode === 'cleared' ? 'cleared' : 'active'
            } student${issuedCount === 1 ? '' : 's'}.`
          : 'No matching cleared students found for bulk issuance yet.'
      );
      setTimeout(() => setStatusNotice(''), 5000);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Bulk certificate issuance failed.');
    } finally {
      setBulkBusy('idle');
    }
  };

  const handleFrscFileUpload = (student: StudentRecord, file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setStatusNotice('Please upload a valid PDF or image file (PNG, JPG, WebP) for FRSC.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      const draft = frscDrafts[student.id];
      const certNum =
        draft?.number?.trim() || student.frscCertificateNumber || student.clearanceNumber;
      const issueDate =
        draft?.issueDate?.trim() ||
        student.frscCertificateIssuedAt ||
        new Date().toISOString().slice(0, 10);

      setBusyStudentId(student.id);
      try {
        await onUpdateCertificate(student.id, {
          frscCertificateUrl: reader.result,
          frscCertificateFileName: file.name,
          frscCertificateMimeType: file.type,
          frscCertificateNumber: certNum,
          frscCertificateIssuedAt: issueDate,
        });
        setStatusNotice(
          `Uploaded & attached official FRSC Certificate (${file.name}) for ${student.fullName}.`
        );
        setTimeout(() => setStatusNotice(''), 4500);
      } catch (err) {
        setStatusNotice((err as Error).message || 'Could not attach FRSC certificate.');
      } finally {
        setBusyStudentId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFrscMetadata = async (student: StudentRecord) => {
    const draft = frscDrafts[student.id];
    const certNum =
      draft?.number?.trim() ?? student.frscCertificateNumber ?? student.clearanceNumber;
    const issueDate =
      draft?.issueDate?.trim() ??
      student.frscCertificateIssuedAt ??
      new Date().toISOString().slice(0, 10);

    setBusyStudentId(student.id);
    try {
      await onUpdateCertificate(student.id, {
        frscCertificateNumber: certNum,
        frscCertificateIssuedAt: issueDate,
      });
      setStatusNotice(`Saved FRSC Certificate metadata for ${student.fullName}.`);
      setTimeout(() => setStatusNotice(''), 3500);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Could not save FRSC details.');
    } finally {
      setBusyStudentId(null);
    }
  };

  const handleRemoveFrscFile = async (student: StudentRecord) => {
    setBusyStudentId(student.id);
    try {
      await onUpdateCertificate(student.id, {
        frscCertificateUrl: '',
      });
      setStatusNotice(`Removed attached FRSC file for ${student.fullName}.`);
      setTimeout(() => setStatusNotice(''), 3500);
    } catch (err) {
      setStatusNotice((err as Error).message || 'Could not remove FRSC certificate.');
    } finally {
      setBusyStudentId(null);
    }
  };

  // KPIs
  const totalCollected = students.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalOutstanding = students.reduce(
    (acc, s) => acc + Math.max(0, s.totalFee - s.amountPaid),
    0
  );
  const frscReadyCount = students.filter((s) => isFrscEligible(s)).length;
  const clearedForCertCount = students.filter((s) => isClearedForSchoolCertificate(s)).length;
  const schoolCertIssuedCount = students.filter((s) => Boolean(s.schoolCertificateIssued)).length;
  const frscUploadedCount = students.filter((s) => Boolean(s.frscCertificateUrl)).length;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.nin.includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.paystackReference && s.paystackReference.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filter === 'pending_initial') return !s.initialDepositVerified;
    if (filter === 'deposit_75')
      return s.initialDepositVerified && !isFullyPaid(s);
    if (filter === 'fully_paid') return isFullyPaid(s);
    if (filter === 'frsc_ready') return isFrscEligible(s);
    return true;
  });

  const certFilteredStudents = students.filter((s) => {
    const q = certSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.nin.includes(q) ||
      s.clearanceNumber.toLowerCase().includes(q) ||
      (s.frscCertificateNumber && s.frscCertificateNumber.toLowerCase().includes(q))
    );
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
          <div className="mt-1 text-xs text-slate-500">Paystack &amp; verified campus receipts</div>
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

      {/* Primary Admin Portal Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-[#0A2E7A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-4 w-4 text-[#F5B700]" />
            <span>Student Roster &amp; Payments ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'certificates'
                ? 'bg-[#0A2E7A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="h-4 w-4 text-[#F5B700]" />
            <span>Certificates &amp; FRSC ({schoolCertIssuedCount}/{students.length})</span>
          </button>
        </div>

        <div className="px-2 text-xs text-slate-500">
          {clearedForCertCount} Cleared · {frscUploadedCount} FRSC Attached
        </div>
      </div>

      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Bulk Certificate Issuance Card */}
          <div className="rounded-2xl border border-[#0A2E7A]/25 bg-white/95 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
                  School &amp; FRSC Certificate Issuance
                </div>
                <h2 className="mt-0.5 font-display text-xl font-extrabold text-slate-900">
                  Bulk Issuance &amp; Student Notification Push
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
                  Generate official A4 landscape School Driving Certificates and push an in-portal
                  notification banner to cleared students (100% verified tuition or completed
                  training) or all active students.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={bulkBusy !== 'idle'}
                  onClick={() => handleBulkIssue('cleared')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E7A] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#082361] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {bulkBusy === 'cleared' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#F5B700]" />
                  ) : (
                    <Send className="h-4 w-4 text-[#F5B700]" />
                  )}
                  <span>
                    Issue &amp; Send to All Cleared Students ({clearedForCertCount})
                  </span>
                </button>

                <button
                  type="button"
                  disabled={bulkBusy !== 'idle' || students.length === 0}
                  onClick={() => handleBulkIssue('all')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#0A2E7A]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#0A2E7A] hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {bulkBusy === 'all' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="h-4 w-4" />
                  )}
                  <span>Issue to All Active ({students.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-slate-500">Cleared Students</div>
                <div className="mt-0.5 font-mono-tabular text-lg font-extrabold text-[#0A2E7A]">
                  {clearedForCertCount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-slate-500">
                  School Certs Issued
                </div>
                <div className="mt-0.5 font-mono-tabular text-lg font-extrabold text-emerald-700">
                  {schoolCertIssuedCount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-slate-500">
                  FRSC Files Attached
                </div>
                <div className="mt-0.5 font-mono-tabular text-lg font-extrabold text-[#0A2E7A]">
                  {frscUploadedCount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-slate-500">Total Students</div>
                <div className="mt-0.5 font-mono-tabular text-lg font-extrabold text-slate-800">
                  {students.length}
                </div>
              </div>
            </div>
          </div>

          {/* Per-Student Certificate & FRSC Management List */}
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-extrabold text-slate-900">
                  Individual Certificate &amp; FRSC Attachment Controls
                </h3>
                <p className="text-xs text-slate-500">
                  Toggle School Certificate issuance, attach scanned FRSC PDF/Image certificates,
                  and manage FRSC certificate numbers.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={certSearchQuery}
                  onChange={(e) => setCertSearchQuery(e.target.value)}
                  placeholder="Search name, ID, or FRSC no..."
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                />
              </div>
            </div>

            {certFilteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-xs text-slate-500">
                No student records match your search.
              </div>
            ) : (
              <div className="space-y-4">
                {certFilteredStudents.map((st) => {
                  const fullyPaid = isFullyPaid(st);
                  const cleared = isClearedForSchoolCertificate(st);
                  const draft = frscDrafts[st.id] || {
                    number: st.frscCertificateNumber ?? st.clearanceNumber,
                    issueDate:
                      st.frscCertificateIssuedAt ?? new Date().toISOString().slice(0, 10),
                  };
                  const isBusy = busyStudentId === st.id;

                  return (
                    <div
                      key={st.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm sm:text-base">
                              {st.fullName}
                            </span>
                            <span className="rounded bg-[#0A2E7A]/10 px-2 py-0.5 font-mono-tabular text-[11px] font-bold text-[#0A2E7A]">
                              {st.id}
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-slate-700">
                              {st.clearanceNumber}
                            </span>
                            {cleared ? (
                              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                {fullyPaid ? '100% Paid' : 'Training Completed'}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                Pending Clearance
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {COURSE_PACKAGES[st.packageId].title} · {st.licenseClass} · NIN:{' '}
                            <span className="font-mono-tabular">{st.nin}</span>
                          </div>
                        </div>

                        {/* School Certificate Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleSchoolCert(st)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                              st.schoolCertificateIssued
                                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                : 'bg-[#0A2E7A] text-white hover:bg-[#082361]'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {st.schoolCertificateIssued
                                ? 'School Cert Issued (Click to Revoke)'
                                : 'Issue School Certificate'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDocument(st, 'school_certificate')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#0A2E7A] cursor-pointer whitespace-nowrap"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#0A2E7A]" />
                            <span>Preview / Print School Cert</span>
                          </button>
                        </div>
                      </div>

                      {/* FRSC Official Certificate Upload & Metadata */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                        <div className="lg:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            FRSC Certificate Number
                          </label>
                          <input
                            type="text"
                            value={draft.number}
                            onChange={(e) =>
                              setFrscDrafts((prev) => ({
                                ...prev,
                                [st.id]: { ...draft, number: e.target.value },
                              }))
                            }
                            placeholder={st.clearanceNumber}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            FRSC Issue Date
                          </label>
                          <input
                            type="date"
                            value={draft.issueDate}
                            onChange={(e) =>
                              setFrscDrafts((prev) => ({
                                ...prev,
                                [st.id]: { ...draft, issueDate: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                          />
                        </div>

                        <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveFrscMetadata(st)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#0A2E7A] cursor-pointer whitespace-nowrap"
                          >
                            <span>Save No. &amp; Date</span>
                          </button>

                          <label className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5B700] px-3 py-2 text-xs font-bold text-[#0A2E7A] hover:bg-[#e5ab00] cursor-pointer whitespace-nowrap">
                            <Upload className="h-3.5 w-3.5" />
                            <span>
                              {st.frscCertificateUrl
                                ? 'Replace FRSC File'
                                : 'Upload FRSC Cert (PDF/Img)'}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                handleFrscFileUpload(st, e.target.files?.[0]);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {st.frscCertificateUrl && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenDocument(st, 'frsc_certificate')}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                              >
                                <FileCheck2 className="h-3.5 w-3.5" />
                                <span>View FRSC</span>
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleRemoveFrscFile(st)}
                                title="Remove attached FRSC certificate file"
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {st.frscCertificateUrl && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Attached FRSC File:{' '}
                            <strong className="font-mono-tabular">
                              {st.frscCertificateFileName || 'FRSC-Certificate'}
                            </strong>
                          </span>
                          <span>
                            Cert No: <strong className="font-mono-tabular">{st.frscCertificateNumber || st.clearanceNumber}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Roster & Payment Verification Table */}
      {activeTab === 'roster' && (
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

                      <td className="px-4 py-3.5 align-top space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 font-semibold">
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
                              <span>Payment Pending Verification</span>
                            </span>
                          )}
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {st.paymentMethod}
                          </span>
                        </div>
                        {st.paystackReference && (
                          <div className="font-mono-tabular text-[11px] text-[#0A2E7A] break-all">
                            Paystack Ref: <strong>{st.paystackReference}</strong>
                            {st.paystackBalanceReference &&
                              st.paystackBalanceReference !== st.paystackReference && (
                                <span className="block text-emerald-700">
                                  25% Ref: <strong>{st.paystackBalanceReference}</strong>
                                </span>
                              )}
                          </div>
                        )}
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
      )}

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
