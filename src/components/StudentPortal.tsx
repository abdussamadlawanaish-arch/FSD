import React, { useState } from 'react';
import {
  Award,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  LogOut,
  Printer,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import {
  BANK_DETAILS,
  COURSE_PACKAGES,
  PrintableDocType,
  SCHOOL_INFO,
  StudentRecord,
  formatNaira,
  getClearanceCountdownDays,
  getDaysSinceRegistration,
  getPaymentReference,
  isFrscEligible,
  isFullyPaid,
} from '../types';

interface StudentPortalProps {
  student: StudentRecord;
  onOpenDocument: (student: StudentRecord, docType: PrintableDocType) => void;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  onOpenDocument,
  onLogout,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  const pkg = COURSE_PACKAGES[student.packageId];
  const remainingBalance = Math.max(0, student.totalFee - student.amountPaid);
  const paymentRef = getPaymentReference(student);
  const daysElapsed = getDaysSinceRegistration(student.registeredAt);
  const daysRemaining = getClearanceCountdownDays(student.registeredAt);
  const fullyPaid = isFullyPaid(student);
  const frscReady = isFrscEligible(student);

  const attendancePct = Math.min(
    100,
    Math.round((student.attendanceSessions / student.totalRequiredSessions) * 100)
  );
  const avgPractical = Math.round(
    (student.practicalScores.steering +
      student.practicalScores.parking +
      student.practicalScores.roadSigns +
      student.practicalScores.defensiveDriving) /
      4
  );

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(paymentRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      setCopiedRef(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Portal Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#0A2E7A]/20 bg-white/95 p-6 shadow-xs">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
            Student Portal · {SCHOOL_INFO.name}
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome, {student.fullName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono-tabular">
            <span>Student ID: <strong className="text-[#0A2E7A]">{student.id}</strong></span>
            <span aria-hidden="true">·</span>
            <span>NIN: <strong>{student.nin}</strong></span>
            <span aria-hidden="true">·</span>
            <span>License: <strong>{student.licenseClass}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenDocument(student, 'admission_pass')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E7A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#082361] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-4 w-4 text-[#F5B700]" />
            <span>Admission &amp; Payment Pass</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Enrolled Package</div>
          <div className="mt-1.5 text-sm font-extrabold text-[#0A2E7A]">{pkg.title}</div>
          <div className="mt-1 text-xs text-slate-600">
            {student.paymentPlan === 'deposit_75'
              ? '75% Initial Deposit Plan'
              : '100% Full Payment Plan'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Tuition Paid &amp; Verified</div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-extrabold text-emerald-700">
            {formatNaira(student.amountPaid)}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-600">
            {student.initialDepositVerified
              ? `Out of ${formatNaira(student.totalFee)} total fee`
              : 'Awaiting GTBank admin confirmation'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Outstanding Balance</div>
          <div
            className={`mt-1.5 font-mono-tabular text-2xl font-extrabold ${
              remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {formatNaira(remainingBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {remainingBalance > 0
              ? student.paymentPlan === 'deposit_75' && student.initialDepositVerified
                ? '25% balance due after 1 month'
                : 'Initial payment pending verification'
              : '100% tuition cleared'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>1-Month Clearance Countdown</span>
            <CalendarClock className="h-4 w-4 text-[#0A2E7A]" />
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-extrabold text-[#0A2E7A]">
            {fullyPaid
              ? 'Cleared'
              : daysRemaining === 0
              ? 'Due Now'
              : `${daysRemaining} Days Left`}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {fullyPaid
              ? 'Full tuition balance settled'
              : `Day ${Math.min(daysElapsed, 30)} of 30 training window`}
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Payment, GTBank Reference & Printable Documents */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0A2E7A]">
              <Building2 className="h-4 w-4 text-[#D99B00]" />
              <span>GTBank Payment &amp; Reference</span>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-bold text-slate-900">{BANK_DETAILS.bankName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Account Name</span>
                <span className="font-bold text-slate-900">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono-tabular font-extrabold text-[#0A2E7A]">
                  {BANK_DETAILS.accountNumber}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A]/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Your Transfer Reference
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A2E7A] hover:underline cursor-pointer"
                >
                  {copiedRef ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedRef ? 'Copied' : 'Copy Reference'}</span>
                </button>
              </div>
              <div className="mt-1 font-mono-tabular text-xs font-bold text-slate-900 break-all">
                {paymentRef}
              </div>
            </div>

            {student.paymentPlan === 'deposit_75' && !fullyPaid && (
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Students on the 75% deposit plan attend physical theory &amp; driving practice
                immediately. Clear the remaining 25% balance (₦16,250) after 1 month to unlock
                your FRSC Certificate.
              </p>
            )}
          </div>

          {/* Printable Documents Box */}
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Official Printable Documents
            </h2>

            <button
              type="button"
              onClick={() => onOpenDocument(student, 'admission_pass')}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#0A2E7A] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#0A2E7A]" />
                <div>
                  <div className="text-sm font-bold text-slate-900">Admission &amp; Payment Pass</div>
                  <div className="text-xs text-slate-500">Campus entry &amp; GTBank slip</div>
                </div>
              </div>
              <Printer className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onOpenDocument(student, 'tuition_receipt')}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#0A2E7A] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-emerald-700" />
                <div>
                  <div className="text-sm font-bold text-slate-900">Official Tuition Receipt</div>
                  <div className="text-xs text-slate-500">
                    {student.initialDepositVerified
                      ? `Verified · ${student.receiptNumber}`
                      : 'Pending Admin Payment Verification'}
                  </div>
                </div>
              </div>
              <Printer className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onOpenDocument(student, 'frsc_clearance')}
              className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-colors cursor-pointer text-left ${
                frscReady
                  ? 'border-emerald-300 bg-emerald-50/70 hover:border-emerald-600'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Award
                  className={`h-5 w-5 ${frscReady ? 'text-emerald-700' : 'text-amber-600'}`}
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    FRSC Certificate Clearance
                  </div>
                  <div className="text-xs text-slate-600">
                    {frscReady
                      ? 'Cleared & Ready to Print'
                      : 'Requires 1-Month Training + 100% Tuition'}
                  </div>
                </div>
              </div>
              <Printer className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right: Training Progress & Instructor Performance Feedback */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white/95 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Campus Training &amp; Instructor Assessment
              </h2>
              <p className="text-xs text-slate-500">
                Updated by your driving instructor after physical campus sessions
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold">
              {student.oneMonthTrainingCompleted ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>1-Month Training Completed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>Training In Progress</span>
                </span>
              )}
            </div>
          </div>

          {/* Attendance & Theory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Campus Attendance</div>
              <div className="mt-1 font-mono-tabular text-xl font-extrabold text-[#0A2E7A]">
                {student.attendanceSessions}/{student.totalRequiredSessions}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#0A2E7A]"
                  style={{ width: `${attendancePct}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-mono-tabular text-slate-500">
                {attendancePct}% completed
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Classroom Theory Score</div>
              <div className="mt-1 font-mono-tabular text-xl font-extrabold text-[#0A2E7A]">
                {student.theoryScore}%
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {student.theoryScore >= 70
                  ? 'Passing highway code score'
                  : 'Pending theory evaluation'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Practical Average</div>
              <div className="mt-1 font-mono-tabular text-xl font-extrabold text-[#0A2E7A]">
                {avgPractical}%
              </div>
              <div className="mt-1 text-xs text-slate-600">4-skill road assessment</div>
            </div>
          </div>

          {/* Practical Skills Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Practical Driving Scorecard
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { label: 'Steering & Vehicle Control', score: student.practicalScores.steering },
                { label: 'Parking & Reversing', score: student.practicalScores.parking },
                { label: 'Road Signs & Highway Rules', score: student.practicalScores.roadSigns },
                {
                  label: 'Defensive Driving & Hazard',
                  score: student.practicalScores.defensiveDriving,
                },
              ].map((skill) => (
                <div
                  key={skill.label}
                  className="rounded-xl border border-slate-200 bg-white p-3.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{skill.label}</span>
                    <span className="font-mono-tabular font-bold text-[#0A2E7A]">
                      {skill.score}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#F5B700]"
                      style={{ width: `${Math.min(100, Math.max(0, skill.score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Feedback */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
              Instructor Performance Remarks
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              {student.instructorFeedback ||
                'No instructor remarks recorded yet. Attend your scheduled campus sessions to receive feedback.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
