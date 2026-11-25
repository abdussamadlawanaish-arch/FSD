import React, { useState } from 'react';
import {
  Award,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  LogOut,
  Printer,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import {
  COURSE_PACKAGES,
  PrintableDocType,
  SCHOOL_INFO,
  StudentRecord,
  formatNaira,
  getClearanceCountdownDays,
  getDaysSinceRegistration,
  getPaymentReference,
  getRemainingBalance,
  isFrscEligible,
  isFullyPaid,
} from '../types';
import { verifyPaystackPayment } from '../api';
import { getExpectedKoboAmount, launchPaystackCheckout } from '../paystack';

interface StudentPortalProps {
  student: StudentRecord;
  onOpenDocument: (student: StudentRecord, docType: PrintableDocType) => void;
  onPaymentCompleted: (updatedStudent: StudentRecord) => void;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  onOpenDocument,
  onPaymentCompleted,
  onLogout,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState<'idle' | 'awaiting' | 'verifying'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [fallbackEmail, setFallbackEmail] = useState(student.email || '');

  const pkg = COURSE_PACKAGES[student.packageId];
  const remainingBalance = getRemainingBalance(student);
  const totalUnpaid = Math.max(0, student.totalFee - student.amountPaid);
  const paymentRef = student.paystackReference || getPaymentReference(student);
  const daysElapsed = getDaysSinceRegistration(student.registeredAt);
  const daysRemaining = getClearanceCountdownDays(student.registeredAt);
  const fullyPaid = isFullyPaid(student);
  const frscReady = isFrscEligible(student);

  const canPayRemaining25 =
    student.initialDepositVerified && !fullyPaid && remainingBalance > 0;
  const canPayInitialPending = !student.initialDepositVerified && student.amountPaid === 0;

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

  const handlePaystackPayment = async (isBalancePayment: boolean) => {
    setPaymentError('');
    setPaymentNotice('');

    const targetEmail = (student.email || fallbackEmail).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setPaymentError('Please enter a valid email address before launching Paystack checkout.');
      return;
    }

    const expectedAmountKobo = getExpectedKoboAmount({
      packageId: student.packageId,
      paymentPlan: student.paymentPlan,
      isBalancePayment,
    });

    setPaymentBusy('awaiting');
    setPaymentNotice('Opening Paystack secure checkout window...');

    try {
      await launchPaystackCheckout({
        studentId: student.id,
        email: targetEmail,
        amountKobo: expectedAmountKobo,
        onSuccess: async (transaction) => {
          setPaymentBusy('verifying');
          setPaymentNotice('Verifying Paystack payment with server...');
          try {
            const updatedStudent = await verifyPaystackPayment({
              reference: transaction.reference,
              studentId: student.id,
              expectedAmountKobo,
              isBalancePayment,
              fallbackChannel: transaction.channel,
            });
            setPaymentBusy('idle');
            setPaymentNotice('');
            onPaymentCompleted(updatedStudent);
          } catch (verifyErr) {
            setPaymentBusy('idle');
            setPaymentNotice('');
            setPaymentError(
              `${
                (verifyErr as Error).message || 'Verification failed.'
              } Reference: ${transaction.reference}. You can retry payment without creating a duplicate account.`
            );
          }
        },
        onCancel: () => {
          setPaymentBusy('idle');
          setPaymentNotice('');
          setPaymentError(
            'Paystack payment popup was closed before completion. You can retry anytime below.'
          );
        },
        onError: (msg) => {
          setPaymentBusy('idle');
          setPaymentNotice('');
          setPaymentError(msg);
        },
      });
    } catch (err) {
      setPaymentBusy('idle');
      setPaymentNotice('');
      setPaymentError((err as Error).message || 'Could not launch Paystack checkout.');
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
            {student.email && (
              <>
                <span aria-hidden="true">·</span>
                <span>{student.email}</span>
              </>
            )}
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
              ? `Out of ${formatNaira(student.totalFee)} total fee (${student.paymentMethod})`
              : 'Initial payment pending'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/95 p-5">
          <div className="text-xs font-semibold text-slate-500">Outstanding Balance</div>
          <div
            className={`mt-1.5 font-mono-tabular text-2xl font-extrabold ${
              totalUnpaid > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {formatNaira(student.initialDepositVerified ? remainingBalance : totalUnpaid)}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {fullyPaid
              ? '100% tuition cleared'
              : canPayRemaining25
              ? '25% balance due after 1 month'
              : 'Complete Paystack checkout below'}
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
        {/* Left: Paystack Payment Status, Balance Checkout & Printable Documents */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A2E7A]">
                <CreditCard className="h-4 w-4 text-[#D99B00]" />
                <span>Tuition Payment &amp; Paystack Status</span>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                  fullyPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : student.initialDepositVerified
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {student.paymentStatus}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-900">{student.paymentMethod}</span>
              </div>
              {student.paymentChannel && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {student.paymentChannel}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Total Tuition</span>
                <span className="font-mono-tabular font-bold text-slate-900">
                  {formatNaira(student.totalFee)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Remaining Balance</span>
                <span
                  className={`font-mono-tabular font-extrabold ${
                    remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {formatNaira(remainingBalance)}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A]/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {student.paystackReference ? 'Paystack Transaction Ref' : 'Student Payment Ref'}
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
              {student.paystackBalanceReference && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-mono-tabular text-emerald-800">
                  25% Balance Ref: <strong>{student.paystackBalanceReference}</strong>
                </div>
              )}
            </div>

            {!student.email && (canPayRemaining25 || canPayInitialPending) && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address for Paystack Receipt
                </label>
                <input
                  type="email"
                  value={fallbackEmail}
                  onChange={(e) => setFallbackEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0A2E7A] focus:outline-none"
                />
              </div>
            )}

            {paymentNotice && (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-medium text-[#0A2E7A] flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>{paymentNotice}</span>
              </div>
            )}

            {paymentError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {canPayRemaining25 && (
              <div className="mt-4 space-y-2.5">
                <p className="text-xs leading-relaxed text-slate-600">
                  Your 75% initial deposit is verified. Clear your remaining 25% balance (₦16,250)
                  with Paystack to unlock your FRSC Certificate Clearance upon training completion.
                </p>
                <button
                  type="button"
                  disabled={paymentBusy !== 'idle'}
                  onClick={() => handlePaystackPayment(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2E7A] px-4 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#082361] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {paymentBusy !== 'idle' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#F5B700]" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-[#F5B700]" />
                  )}
                  <span>
                    {paymentBusy === 'verifying'
                      ? 'Verifying Balance Payment...'
                      : 'Pay Remaining Balance (₦16,250)'}
                  </span>
                </button>
              </div>
            )}

            {canPayInitialPending && (
              <div className="mt-4 space-y-2.5">
                <p className="text-xs leading-relaxed text-slate-600">
                  Your registration ID ({student.id}) is saved. Complete your initial Paystack
                  payment of <strong>{formatNaira(student.initialAmountDue)}</strong> now to verify
                  your admission.
                </p>
                <button
                  type="button"
                  disabled={paymentBusy !== 'idle'}
                  onClick={() => handlePaystackPayment(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2E7A] px-4 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#082361] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {paymentBusy !== 'idle' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#F5B700]" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-[#F5B700]" />
                  )}
                  <span>
                    {paymentBusy === 'verifying'
                      ? 'Verifying Payment...'
                      : `Pay Initial Tuition (${formatNaira(student.initialAmountDue)})`}
                  </span>
                </button>
              </div>
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
                  <div className="text-xs text-slate-500">Campus entry &amp; registration slip</div>
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
                      ? `Verified · ${student.paystackReference || student.receiptNumber}`
                      : 'Pending Payment Verification'}
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
