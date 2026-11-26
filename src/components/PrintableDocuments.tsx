import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  X,
  ShieldCheck,
  Building2,
  Award,
  AlertCircle,
  Download,
  FileCheck2,
} from 'lucide-react';
import {
  BANK_DETAILS,
  COURSE_PACKAGES,
  PrintableDocType,
  SCHOOL_INFO,
  StudentRecord,
  formatNaira,
  getPaymentReference,
  isFrscEligible,
  isFullyPaid,
} from '../types';
import { BrandLogo, DocumentWatermark } from './BrandLogo';

const CalligraphicSignatureSvg: React.FC<{ className?: string }> = ({ className = 'h-11 w-36' }) => (
  <svg
    viewBox="0 0 220 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Authorized Signature"
  >
    <path
      d="M18 52 C26 24, 42 12, 54 18 C62 22, 42 46, 36 52 C48 44, 68 26, 78 32 C84 36, 70 50, 78 52 C88 54, 102 32, 112 24 C118 19, 114 48, 124 46 C132 44, 140 30, 148 34 C154 37, 148 48, 158 46 C168 44, 182 32, 198 34"
      stroke="#1e3a8a"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 58 C64 52, 134 48, 206 50"
      stroke="#1e3a8a"
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.85"
    />
    <path
      d="M42 26 C58 24, 78 22, 92 24"
      stroke="#1e3a8a"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const VerificationStampSvg: React.FC<{ idPrefix: string; className?: string }> = ({
  idPrefix,
  className = 'h-16 w-16',
}) => {
  const pathId = `${idPrefix}-stamp-ring`;
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FUSAHA Driving School Verified & Paid Official Stamp"
    >
      <defs>
        <path id={pathId} d="M 60,60 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0" />
      </defs>
      <circle cx="60" cy="60" r="54" fill="none" stroke="#1e3a8a" strokeWidth="2" opacity="0.75" />
      <circle
        cx="60"
        cy="60"
        r="49"
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity="0.65"
      />
      <circle cx="60" cy="60" r="30" fill="none" stroke="#1e3a8a" strokeWidth="1.4" opacity="0.75" />
      <text
        fill="#1e3a8a"
        fontSize="7.4"
        fontWeight="700"
        letterSpacing="1.05"
        opacity="0.85"
      >
        <textPath href={`#${pathId}`} startOffset="2%">
          FUSAHA DRIVING SCHOOL • VERIFIED &amp; PAID • DUTSE •
        </textPath>
      </text>
      <text
        x="60"
        y="57"
        textAnchor="middle"
        fill="#1e3a8a"
        fontSize="8.5"
        fontWeight="800"
        letterSpacing="0.8"
        opacity="0.9"
      >
        VERIFIED
      </text>
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill="#1e3a8a"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="0.6"
        opacity="0.85"
      >
        &amp; PAID
      </text>
    </svg>
  );
};

const DeterministicQrSvg: React.FC<{ seed: string; className?: string }> = ({
  seed,
  className = 'h-16 w-16',
}) => {
  const size = 15;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const cells: Array<{ x: number; y: number }> = [];
  const isFinder = (r: number, c: number) =>
    (r < 5 && c < 5) || (r < 5 && c >= size - 5) || (r >= size - 5 && c < 5);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        const lr = r >= size - 5 ? r - (size - 5) : r;
        const lc = c >= size - 5 ? c - (size - 5) : c;
        const outer = lr === 0 || lr === 4 || lc === 0 || lc === 4;
        const inner = lr === 2 && lc === 2;
        if (outer || inner) {
          cells.push({ x: c, y: r });
        }
      } else {
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        if ((hash >>> 0) % 2 === 0) {
          cells.push({ x: c, y: r });
        }
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
      aria-label="Certificate Verification QR Code"
    >
      <rect x="0" y="0" width={size} height={size} fill="#ffffff" />
      {cells.map((cell, idx) => (
        <rect key={idx} x={cell.x} y={cell.y} width="1" height="1" fill="#0A2E7A" />
      ))}
    </svg>
  );
};

interface PrintableDocumentModalProps {
  student: StudentRecord;
  docType: PrintableDocType;
  logoUrl: string;
  onClose: () => void;
}

export const PrintableDocumentModal: React.FC<PrintableDocumentModalProps> = ({
  student,
  docType,
  logoUrl,
  onClose,
}) => {
  const [copiedAcct, setCopiedAcct] = useState(false);

  const pkg = COURSE_PACKAGES[student.packageId];
  const remainingBalance = Math.max(0, student.totalFee - student.amountPaid);
  const paymentRef = student.paystackReference || getPaymentReference(student);
  const formattedRegDate = new Date(student.registeredAt).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedIssueDate = new Date(
    student.paymentVerifiedAt || student.registeredAt
  ).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
      setCopiedAcct(true);
      setTimeout(() => setCopiedAcct(false), 2000);
    } catch {
      setCopiedAcct(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const avgPractical = Math.round(
    (student.practicalScores.steering +
      student.practicalScores.parking +
      student.practicalScores.roadSigns +
      student.practicalScores.defensiveDriving) /
      4
  );

  const frscReady = isFrscEligible(student);
  const fullyPaid = isFullyPaid(student);

  const certVerificationCode = `FDS-CERT-${student.id}-${student.nin.slice(-4)}`;
  const formattedCertDate = new Date(
    student.certificateIssuedAt || student.trainingCompletedAt || student.registeredAt
  ).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedFrscCertDate = new Date(
    student.frscCertificateIssuedAt || student.certificateIssuedAt || student.registeredAt
  ).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isFrscPdf =
    Boolean(student.frscCertificateMimeType?.includes('pdf')) ||
    Boolean(student.frscCertificateUrl?.startsWith('data:application/pdf'));

  return (
    <div
      className="print-only-container fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 p-3 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full my-2 sm:my-6 ${
          docType === 'school_certificate' ? 'max-w-5xl' : 'max-w-4xl'
        }`}
      >
        {/* Top Action Bar (Hidden in Print) */}
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-lg border border-slate-200">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0A2E7A]">
            <ShieldCheck className="h-5 w-5 text-[#F5B700]" />
            <span>
              {docType === 'admission_pass' && 'FUSAHA DRIVING SCHOOL — Admission & Payment Pass'}
              {docType === 'tuition_receipt' && 'FUSAHA DRIVING SCHOOL — Official Tuition Receipt'}
              {docType === 'frsc_clearance' && 'FRSC Driving School Certificate Clearance'}
              {docType === 'school_certificate' &&
                'FUSAHA DRIVING SCHOOL — Official Driving Certificate (A4 Landscape)'}
              {docType === 'frsc_certificate' && 'FRSC Official Driving Certificate'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {docType === 'frsc_certificate' && student.frscCertificateUrl && (
              <a
                href={student.frscCertificateUrl}
                download={
                  student.frscCertificateFileName ||
                  `FRSC-Certificate-${student.id}.${isFrscPdf ? 'pdf' : 'png'}`
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A2E7A] bg-white px-3.5 py-2 text-sm font-semibold text-[#0A2E7A] hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </a>
            )}
            {((docType !== 'frsc_clearance' || frscReady) &&
              (docType !== 'frsc_certificate' || Boolean(student.frscCertificateUrl))) && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A2E7A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#082361] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ADMISSION & PAYMENT PASS */}
        {docType === 'admission_pass' && (
          <div className="print-document-sheet relative overflow-hidden rounded-2xl border-2 border-[#0A2E7A] bg-white p-6 sm:p-8 shadow-xl">
            <DocumentWatermark logoUrl={logoUrl} />

            <div className="relative z-10">
              {/* Letterhead */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-[#0A2E7A] pb-5">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <BrandLogo logoUrl={logoUrl} className="h-20 w-auto object-contain shrink-0" />
                  <div>
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#0A2E7A]">
                      {SCHOOL_INFO.name}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      {SCHOOL_INFO.address}
                    </p>
                    <p className="text-xs text-slate-600 font-mono-tabular">
                      Tel: {SCHOOL_INFO.phone} · Email: {SCHOOL_INFO.email}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#0A2E7A]">
                      Accredited Training Partner: {SCHOOL_INFO.licensingAuthority}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A] px-4 py-3 text-center text-white shrink-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#F5B700]">
                    Admission & Payment Pass
                  </div>
                  <div className="mt-1 font-mono-tabular text-lg font-bold tracking-tight">
                    {student.id}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-200">{formattedRegDate}</div>
                </div>
              </div>

              {/* Login NIN Reminder & Key Numbers */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5">
                  <div className="text-xs font-medium text-slate-500">Portal Login NIN</div>
                  <div className="mt-1 font-mono-tabular text-base font-bold text-[#0A2E7A]">
                    {student.nin}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5">
                  <div className="text-xs font-medium text-slate-500">License Category</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{student.licenseClass}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5">
                  <div className="text-xs font-medium text-slate-500">Initial Amount Due</div>
                  <div className="mt-1 font-mono-tabular text-base font-bold text-[#0A2E7A]">
                    {formatNaira(student.initialAmountDue)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5">
                  <div className="text-xs font-medium text-slate-500">Remaining Balance</div>
                  <div className="mt-1 font-mono-tabular text-base font-bold text-amber-700">
                    {formatNaira(remainingBalance)}
                  </div>
                </div>
              </div>

              {/* Package & Payment Policy Summary */}
              <div className="mt-5 rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A]/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Selected Program & Plan
                    </span>
                    <h3 className="text-base font-bold text-[#0A2E7A]">
                      {pkg.title} ({formatNaira(student.totalFee)})
                    </h3>
                  </div>
                  <span className="rounded-lg border border-[#0A2E7A]/25 bg-white px-3 py-1 text-xs font-bold text-[#0A2E7A]">
                    {student.paymentPlan === 'deposit_75'
                      ? '75% Initial Deposit Plan (₦48,750 Now / ₦16,250 After 1 Month)'
                      : `100% Full Payment Plan (${formatNaira(student.totalFee)})`}
                  </span>
                </div>

                {student.packageId === 'full_beginner' && student.paymentPlan === 'deposit_75' ? (
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                    <strong className="text-[#0A2E7A]">Payment Policy Reminder:</strong> Students on
                    the 75% deposit plan can attend physical theory &amp; driving practice immediately.
                    The remaining 25% balance (₦16,250) must be cleared after 1 month of training to
                    collect the official FRSC Certificate.
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                    <strong className="text-[#0A2E7A]">Payment Policy:</strong> Full 100% tuition (
                    {formatNaira(student.totalFee)}) applies to this registration. No post-training
                    balance remains once your GTBank transfer is verified by the school administration.
                  </p>
                )}
              </div>

              {/* Student Profile Details */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Registered Student Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5 rounded-xl border border-slate-200 bg-white/95 p-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500">Full Name</span>
                    <span className="font-semibold text-slate-900">{student.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Date of Birth</span>
                    <span className="font-mono-tabular font-medium text-slate-900">
                      {student.dateOfBirth}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Blood Group</span>
                    <span className="font-semibold text-slate-900">{student.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">NIN Number</span>
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      {student.nin}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Mother&apos;s Maiden Name</span>
                    <span className="font-medium text-slate-900">{student.mothersMaidenName}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Nationality</span>
                    <span className="font-medium text-slate-900">{student.nationality}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">State / LGA of Origin</span>
                    <span className="font-medium text-slate-900">
                      {student.stateOfOrigin} · {student.localGovernment}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs text-slate-500">Home Address</span>
                    <span className="font-medium text-slate-900">{student.homeAddress}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Next of Kin</span>
                    <span className="font-medium text-slate-900">{student.nextOfKin}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Next of Kin Phone</span>
                    <span className="font-mono-tabular font-medium text-slate-900">
                      {student.nextOfKinPhone}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Verification Status</span>
                    <span
                      className={`font-semibold ${
                        student.initialDepositVerified ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {student.initialDepositVerified
                        ? `${student.paymentMethod} Verified`
                        : 'Pending Payment Verification'}
                    </span>
                    {student.paystackReference && (
                      <span className="block font-mono-tabular text-[11px] text-slate-600 mt-0.5 break-all">
                        Ref: {student.paystackReference}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Prominent GTBank Payment Box */}
              <div className="mt-5 rounded-xl border-2 border-[#0A2E7A] bg-[#0A2E7A] p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#F5B700]" />
                    <h4 className="font-display text-base font-bold tracking-tight">
                      Official GTBank Tuition Payment Account
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-[#F5B700]">
                    Direct Bank Transfer or Branch Deposit
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-300">Bank Name</div>
                    <div className="mt-0.5 text-sm font-bold">{BANK_DETAILS.bankName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-300">Account Name</div>
                    <div className="mt-0.5 text-sm font-bold">{BANK_DETAILS.accountName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-300">Account Number</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono-tabular text-lg font-extrabold tracking-wider text-[#F5B700]">
                        {BANK_DETAILS.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="no-print inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 text-xs font-medium text-white hover:bg-white/25 transition-colors cursor-pointer"
                      >
                        {copiedAcct ? (
                          <>
                            <Check className="h-3 w-3 text-[#F5B700]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-white/10 px-3.5 py-2.5 text-xs">
                  <span className="text-slate-200">Required Payment Narration / Reference: </span>
                  <span className="font-mono-tabular font-bold text-[#F5B700]">{paymentRef}</span>
                </div>
              </div>

              {/* Step-by-Step Payment Instructions */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A] mb-2">
                  Step-by-Step On-Campus Admission &amp; Payment Instructions
                </h4>
                <ol className="space-y-1.5 text-xs sm:text-sm text-slate-700 list-decimal list-inside">
                  <li>
                    Transfer or deposit{' '}
                    <strong className="font-mono-tabular text-slate-900">
                      {formatNaira(student.initialAmountDue)}
                    </strong>{' '}
                    to <strong>{BANK_DETAILS.bankName}</strong> ({BANK_DETAILS.accountName} —{' '}
                    <span className="font-mono-tabular font-semibold">
                      {BANK_DETAILS.accountNumber}
                    </span>
                    ).
                  </li>
                  <li>
                    Enter <strong className="font-mono-tabular">{paymentRef}</strong> as your
                    transfer narration or bank teller reference.
                  </li>
                  <li>
                    Print this Admission &amp; Payment Pass and bring it alongside your bank
                    transfer receipt or deposit slip to{' '}
                    <strong>{SCHOOL_INFO.address}</strong> for instant verification and classroom
                    induction.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* OFFICIAL TUITION RECEIPT */}
        {docType === 'tuition_receipt' && (
          <div className="print-document-sheet relative overflow-hidden rounded-2xl border-2 border-[#0A2E7A] bg-white p-6 sm:p-8 shadow-xl">
            <DocumentWatermark logoUrl={logoUrl} />

            <div className="relative z-10">
              {/* Official Letterhead */}
              <div className="flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 border-b-2 border-[#0A2E7A] pb-4 print:pb-3.5">
                <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3.5 text-center sm:text-left print:text-left min-w-0 flex-1">
                  <BrandLogo
                    logoUrl={logoUrl}
                    className="h-16 sm:h-20 print:h-16 w-auto object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl sm:text-2xl print:text-xl font-extrabold tracking-tight text-[#0A2E7A]">
                      {SCHOOL_INFO.name}
                    </h2>
                    <p className="text-xs sm:text-sm print:text-xs font-medium text-slate-700">
                      {SCHOOL_INFO.address}
                    </p>
                    <p className="text-xs text-slate-600 font-mono-tabular">
                      Phone: {SCHOOL_INFO.phone} · Email: {SCHOOL_INFO.email}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-center sm:text-right print:text-right rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A]/[0.04] px-3.5 py-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A2E7A] whitespace-nowrap">
                    Official Tuition Receipt
                  </div>
                  <div className="mt-1 font-mono-tabular text-base sm:text-lg print:text-base font-extrabold text-slate-900 whitespace-nowrap">
                    {student.receiptNumber}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 whitespace-nowrap">
                    Issued: {formattedIssueDate}
                  </div>
                </div>
              </div>

              {/* Verified Stamp & Student Info */}
              <div className="mt-5 print:mt-4 flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/90 p-4 print:p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Received From</span>
                    <span className="font-bold text-slate-900">{student.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Student ID</span>
                    <span className="font-mono-tabular font-bold text-[#0A2E7A] whitespace-nowrap">
                      {student.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">NIN Number</span>
                    <span className="font-mono-tabular font-semibold text-slate-800 whitespace-nowrap">
                      {student.nin}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Registered License Class</span>
                    <span className="font-semibold text-slate-800 whitespace-nowrap">
                      {student.licenseClass}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center print:self-center">
                  {student.amountPaid > 0 && student.initialDepositVerified ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-700 bg-emerald-50 px-4 py-2 text-emerald-800 whitespace-nowrap">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-extrabold tracking-widest uppercase">
                          VERIFIED PAID
                        </div>
                        <div className="text-[11px] font-medium">
                          {fullyPaid ? '100% Cleared' : '75% Deposit Cleared'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-600 bg-amber-50 px-4 py-2 text-amber-800 whitespace-nowrap">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-extrabold tracking-widest uppercase">
                          PENDING VERIFICATION
                        </div>
                        <div className="text-[11px] font-medium">Awaiting Admin Confirmation</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="mt-5 print:mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white/95">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A2E7A] text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Fee Description</th>
                      <th className="px-4 py-2.5 font-semibold">Payment Plan / Channel</th>
                      <th className="px-4 py-2.5 font-semibold text-right whitespace-nowrap">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 print:py-2.5">
                        <div className="font-semibold text-slate-900">{pkg.title}</div>
                        <div className="text-xs text-slate-500">{pkg.subtitle}</div>
                      </td>
                      <td className="px-4 py-3 print:py-2.5 text-slate-700">
                        {student.paymentPlan === 'deposit_75'
                          ? '75% Initial Deposit Plan'
                          : '100% Full Payment Plan'}
                      </td>
                      <td className="px-4 py-3 print:py-2.5 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                        {formatNaira(student.totalFee)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 print:py-2.5 font-medium text-slate-800">
                        Verified Payment Channel
                      </td>
                      <td className="px-4 py-3 print:py-2.5 text-xs text-slate-700" colSpan={2}>
                        {student.paymentMethod === 'Paystack' ? (
                          <div>
                            <strong>Paystack Checkout</strong>
                            {student.paymentChannel && (
                              <span className="capitalize"> · Channel: {student.paymentChannel}</span>
                            )}
                            {student.paystackReference && (
                              <span className="block font-mono-tabular font-bold text-[#0A2E7A] mt-0.5 break-all">
                                Transaction Ref: {student.paystackReference}
                              </span>
                            )}
                            {student.paystackBalanceReference &&
                              student.paystackBalanceReference !== student.paystackReference && (
                                <span className="block font-mono-tabular font-bold text-emerald-700 mt-0.5 break-all">
                                  25% Balance Ref: {student.paystackBalanceReference}
                                </span>
                              )}
                          </div>
                        ) : (
                          <div>
                            <strong>{student.paymentMethod}</strong> ·{' '}
                            <strong>{BANK_DETAILS.shortBankName}</strong> ({BANK_DETAILS.accountName}{' '}
                            ·{' '}
                            <span className="font-mono-tabular font-bold">
                              {BANK_DETAILS.accountNumber}
                            </span>
                            )
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/60">
                      <td className="px-4 py-3 print:py-2.5 font-bold text-emerald-900" colSpan={2}>
                        Total Amount Paid &amp; Verified
                      </td>
                      <td className="px-4 py-3 print:py-2.5 text-right font-mono-tabular text-base font-extrabold text-emerald-800 whitespace-nowrap">
                        {formatNaira(student.amountPaid)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="px-4 py-3 print:py-2.5 font-bold text-slate-900" colSpan={2}>
                        Remaining Outstanding Balance
                      </td>
                      <td
                        className={`px-4 py-3 print:py-2.5 text-right font-mono-tabular text-base font-extrabold whitespace-nowrap ${
                          remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-800'
                        }`}
                      >
                        {formatNaira(remainingBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reference & Authorization Footer */}
              <div className="mt-4 print:mt-3 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 pt-3 print:pt-2.5 border-t border-slate-200 text-xs text-slate-600 items-end">
                <div>
                  <div className="font-semibold text-slate-800">
                    {student.paystackReference
                      ? 'Paystack Transaction Reference'
                      : 'Payment Narration Reference'}
                  </div>
                  <div className="mt-1 font-mono-tabular font-bold text-slate-800 break-all">
                    {paymentRef}
                  </div>
                  {remainingBalance > 0 && (
                    <p className="mt-1.5 text-amber-800 font-medium">
                      Note: Remaining 25% balance ({formatNaira(remainingBalance)}) is due after 1
                      month of training prior to FRSC certificate collection.
                    </p>
                  )}
                </div>
                <div className="sm:text-right print:text-right flex flex-col items-center sm:items-end print:items-end justify-end">
                  <div className="flex items-end gap-2.5 mb-1">
                    {student.amountPaid > 0 && student.initialDepositVerified && (
                      <VerificationStampSvg
                        idPrefix={`receipt-${student.id}`}
                        className="h-14 w-14 -rotate-6 shrink-0"
                      />
                    )}
                    <CalligraphicSignatureSvg className="h-11 w-36 shrink-0" />
                  </div>
                  <div className="inline-block border-t border-slate-400 pt-1.5 px-5 text-center whitespace-nowrap">
                    <div className="font-bold text-[#0A2E7A]">Authorized School Bursar / Admin</div>
                    <div>{SCHOOL_INFO.name}, Dutse</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FRSC CERTIFICATE CLEARANCE */}
        {docType === 'frsc_clearance' && (
          <div className="print-document-sheet relative overflow-hidden rounded-2xl border-2 border-[#0A2E7A] bg-white p-6 sm:p-8 shadow-xl">
            <DocumentWatermark logoUrl={logoUrl} />

            <div className="relative z-10">
              {!frscReady ? (
                <div className="py-10 text-center max-w-lg mx-auto">
                  <Award className="mx-auto h-12 w-12 text-amber-600" />
                  <h3 className="mt-3 font-display text-xl font-bold text-slate-900">
                    FRSC Certificate Clearance Locked
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Both 1-month physical training completion and 100% tuition payment clearance
                    must be confirmed before the official FRSC Certificate Clearance can be issued.
                  </p>
                  <div className="mt-5 space-y-2 text-left rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span>100% Full Tuition Cleared ({formatNaira(student.totalFee)})</span>
                      <span
                        className={`font-semibold ${
                          fullyPaid ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {fullyPaid ? 'Completed' : `Pending (${formatNaira(remainingBalance)} due)`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>1-Month Physical Training Completed</span>
                      <span
                        className={`font-semibold ${
                          student.oneMonthTrainingCompleted ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {student.oneMonthTrainingCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Clearance Letterhead */}
                  <div className="flex flex-col items-center text-center border-b-2 border-[#0A2E7A] pb-5">
                    <BrandLogo logoUrl={logoUrl} className="h-24 w-auto object-contain mb-3" />
                    <div className="text-xs font-bold uppercase tracking-widest text-[#0A2E7A]">
                      {SCHOOL_INFO.licensingAuthority}
                    </div>
                    <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A2E7A]">
                      DRIVING SCHOOL CERTIFICATE CLEARANCE
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Issued by {SCHOOL_INFO.name} · {SCHOOL_INFO.address}
                    </p>
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      Clearance Reference: {student.clearanceNumber} · Date: {formattedIssueDate}
                    </p>
                  </div>

                  {/* Certification Body */}
                  <div className="mt-6 rounded-xl border border-[#0A2E7A]/20 bg-white/95 p-5">
                    <p className="text-sm sm:text-base leading-relaxed text-slate-800">
                      This is to certify that{' '}
                      <strong className="text-[#0A2E7A] uppercase">{student.fullName}</strong>{' '}
                      (Student ID:{' '}
                      <strong className="font-mono-tabular">{student.id}</strong>, National
                      Identification Number:{' '}
                      <strong className="font-mono-tabular">{student.nin}</strong>) has satisfied
                      all mandatory theoretical, practical driving, and financial obligations at{' '}
                      <strong>{SCHOOL_INFO.name}</strong> and is hereby cleared for{' '}
                      <strong>{SCHOOL_INFO.licensingAuthority}</strong> Driver&apos;s License{' '}
                      <strong>({student.licenseClass})</strong> processing and certificate issuance.
                    </p>

                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Program Completed</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-900">{pkg.title}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Attendance</div>
                        <div className="mt-0.5 font-mono-tabular text-sm font-bold text-slate-900">
                          {student.attendanceSessions}/{student.totalRequiredSessions} Sessions
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Theory Score</div>
                        <div className="mt-0.5 font-mono-tabular text-sm font-bold text-emerald-700">
                          {student.theoryScore}% (Passed)
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Practical Average</div>
                        <div className="mt-0.5 font-mono-tabular text-sm font-bold text-emerald-700">
                          {avgPractical}% (Passed)
                        </div>
                      </div>
                    </div>

                    {/* Verified Tuition & Candidate Identity Details */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Date of Birth / Blood Group</span>
                        <span className="font-semibold text-slate-900 font-mono-tabular">
                          {student.dateOfBirth} · {student.bloodGroup}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">State &amp; LGA of Origin</span>
                        <span className="font-semibold text-slate-900">
                          {student.stateOfOrigin} State · {student.localGovernment}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tuition Clearance Status</span>
                        <span className="font-bold text-emerald-700">
                          100% Paid ({formatNaira(student.amountPaid)}) · Receipt{' '}
                          {student.receiptNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Signature Strip */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-4">
                    <div className="border-t border-slate-400 pt-2 text-center text-xs">
                      <div className="font-bold text-slate-900">Chief Driving Instructor</div>
                      <div className="text-slate-500">{SCHOOL_INFO.name}</div>
                    </div>

                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0A2E7A] bg-[#F5B700]/15 px-4 py-2 text-[#0A2E7A]">
                        <Award className="h-5 w-5 text-[#0A2E7A]" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">
                          FRSC CLEARED
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-400 pt-2 text-center text-xs">
                      <div className="font-bold text-slate-900">School Director / Registrar</div>
                      <div className="text-slate-500">Dutse, Jigawa State</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* FUSAHA DRIVING SCHOOL CERTIFICATE (A4 LANDSCAPE) */}
        {docType === 'school_certificate' && (
          <div className="print-document-sheet print-certificate-landscape relative overflow-hidden rounded-2xl border-4 border-[#0A2E7A] bg-white p-4 sm:p-6 shadow-xl">
            <DocumentWatermark logoUrl={logoUrl} />

            {/* Decorative Inner Gold Frame */}
            <div className="relative z-10 rounded-xl border-2 border-[#F5B700] p-5 sm:p-7 print:p-5">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 border-b-2 border-[#0A2E7A]/20 pb-4">
                <div className="flex items-center gap-4">
                  <BrandLogo
                    logoUrl={logoUrl}
                    className="h-16 sm:h-20 print:h-16 w-auto object-contain shrink-0"
                  />
                  <div className="text-left">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#C99100]">
                      Federal Republic of Nigeria · FRSC Accredited Center
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl print:text-2xl font-extrabold tracking-tight text-[#0A2E7A]">
                      {SCHOOL_INFO.name}
                    </h2>
                    <p className="text-xs font-medium text-slate-700">
                      {SCHOOL_INFO.address} · Tel: {SCHOOL_INFO.phone}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-center sm:text-right print:text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    FRSC Clearance Number
                  </div>
                  <div className="font-mono-tabular text-sm font-extrabold text-[#0A2E7A] whitespace-nowrap">
                    {student.clearanceNumber}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 whitespace-nowrap">
                    Issued: <strong>{formattedCertDate}</strong>
                  </div>
                </div>
              </div>

              {/* Certificate Main Body */}
              <div className="mt-5 print:mt-4 text-center space-y-2.5">
                <div className="inline-block rounded-full border border-[#0A2E7A]/25 bg-[#0A2E7A]/[0.04] px-4 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0A2E7A]">
                  Certificate of Driving Training Completion
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  This official Driving School Certificate is proudly awarded to
                </p>
                <div className="font-display text-2xl sm:text-4xl print:text-3xl font-extrabold uppercase tracking-tight text-[#0A2E7A] py-1">
                  {student.fullName}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-mono-tabular text-slate-700">
                  <span>
                    Student ID: <strong className="text-[#0A2E7A]">{student.id}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    NIN: <strong>{student.nin}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    License Class: <strong className="text-[#0A2E7A]">{student.licenseClass}</strong>
                  </span>
                </div>

                <p className="mx-auto max-w-3xl pt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
                  for successfully fulfilling the prescribed classroom highway theory, road safety
                  standards, and practical behind-the-wheel driving curriculum under the{' '}
                  <strong>{pkg.title}</strong> in accordance with the{' '}
                  <strong>{SCHOOL_INFO.licensingAuthority}</strong> accreditation guidelines.
                </p>
              </div>

              {/* Footer: Verification QR Code + Official Stamp & Calligraphic Signature */}
              <div className="mt-6 print:mt-5 grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 items-end border-t border-slate-200 pt-4">
                {/* Left: QR / Verification Code */}
                <div className="flex items-center gap-3 justify-center sm:justify-start print:justify-start">
                  <div className="rounded-lg border border-[#0A2E7A]/25 bg-white p-1.5 shrink-0">
                    <DeterministicQrSvg
                      seed={`${certVerificationCode}|${student.clearanceNumber}|${student.fullName}`}
                      className="h-14 w-14"
                    />
                  </div>
                  <div className="text-left text-[11px] text-slate-600">
                    <div className="font-bold uppercase tracking-wider text-[#0A2E7A]">
                      Verification Code
                    </div>
                    <div className="font-mono-tabular font-bold text-slate-900 whitespace-nowrap">
                      {certVerificationCode}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Theory: {student.theoryScore}% · Practical: {avgPractical}%
                    </div>
                  </div>
                </div>

                {/* Center: Official Circular Verification Stamp */}
                <div className="flex flex-col items-center justify-center">
                  <VerificationStampSvg
                    idPrefix={`cert-${student.id}`}
                    className="h-16 w-16 -rotate-6"
                  />
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                    Official School Seal
                  </span>
                </div>

                {/* Right: Director / Bursar Calligraphic Signature */}
                <div className="flex flex-col items-center sm:items-end print:items-end justify-end">
                  <CalligraphicSignatureSvg className="h-11 w-36 mb-1" />
                  <div className="border-t border-slate-400 pt-1.5 px-5 text-center text-xs whitespace-nowrap">
                    <div className="font-bold text-[#0A2E7A]">School Director / Bursar</div>
                    <div className="text-slate-600">{SCHOOL_INFO.name}, Dutse</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OFFICIAL FRSC CERTIFICATE VIEWER & PRINTER */}
        {docType === 'frsc_certificate' && (
          <div className="print-document-sheet relative overflow-hidden rounded-2xl border-2 border-[#0A2E7A] bg-white p-6 sm:p-8 shadow-xl">
            <DocumentWatermark logoUrl={logoUrl} />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 border-b-2 border-[#0A2E7A] pb-4">
                <div className="flex items-center gap-3.5">
                  <BrandLogo logoUrl={logoUrl} className="h-16 w-auto object-contain shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
                      {SCHOOL_INFO.licensingAuthority}
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                      Official FRSC Driving Certificate
                    </h2>
                    <p className="text-xs text-slate-600">
                      Candidate: <strong>{student.fullName}</strong> ({student.id}) ·{' '}
                      {student.licenseClass}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-center sm:text-right print:text-right rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A]/[0.04] px-3.5 py-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A2E7A] whitespace-nowrap">
                    FRSC Certificate No.
                  </div>
                  <div className="font-mono-tabular text-sm font-extrabold text-slate-900 whitespace-nowrap">
                    {student.frscCertificateNumber || student.clearanceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 whitespace-nowrap">
                    Issued: {formattedFrscCertDate}
                  </div>
                </div>
              </div>

              {!student.frscCertificateUrl ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
                  <FileCheck2 className="mx-auto h-10 w-10 text-amber-600" />
                  <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
                    FRSC Certificate Pending Upload
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
                    Your FRSC Clearance Number is{' '}
                    <strong className="font-mono-tabular">{student.clearanceNumber}</strong>. Once
                    Administration uploads your official FRSC Certificate file, you can view,
                    download, and print it here.
                  </p>
                </div>
              ) : isFrscPdf ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                    <iframe
                      src={student.frscCertificateUrl}
                      title="Official FRSC Driving Certificate PDF"
                      className="w-full h-[540px] bg-white"
                    />
                  </div>
                  <div className="no-print flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      Attached Document:{' '}
                      <strong className="font-mono-tabular">
                        {student.frscCertificateFileName || 'FRSC-Certificate.pdf'}
                      </strong>
                    </span>
                    <a
                      href={student.frscCertificateUrl}
                      download={
                        student.frscCertificateFileName || `FRSC-Certificate-${student.id}.pdf`
                      }
                      className="inline-flex items-center gap-1.5 font-bold text-[#0A2E7A] hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF File</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col items-center">
                  <img
                    src={student.frscCertificateUrl}
                    alt={`FRSC Certificate for ${student.fullName}`}
                    className="max-h-[650px] w-auto object-contain rounded-lg shadow-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
