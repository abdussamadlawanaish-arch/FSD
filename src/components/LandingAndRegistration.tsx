import React, { useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  BANK_DETAILS,
  BLOOD_GROUPS,
  COURSE_PACKAGES,
  CoursePackageId,
  LICENSE_CLASSES,
  NIGERIAN_STATES,
  PaymentPlanId,
  SCHOOL_INFO,
  StudentRecord,
  formatNaira,
} from '../types';
import { BrandLogo } from './BrandLogo';

interface LandingAndRegistrationProps {
  logoUrl: string;
  existingNins: string[];
  onOpenLogin: () => void;
  onOpenCreateAccount: () => void;
  onRegisterStudent: (newStudentData: Omit<StudentRecord, 'id' | 'receiptNumber' | 'clearanceNumber' | 'registeredAt' | 'amountPaid' | 'initialDepositVerified' | 'finalBalanceVerified' | 'attendanceSessions' | 'totalRequiredSessions' | 'theoryScore' | 'practicalScores' | 'instructorFeedback' | 'oneMonthTrainingCompleted'>) => void;
}

export const LandingAndRegistration: React.FC<LandingAndRegistrationProps> = ({
  logoUrl,
  existingNins,
  onOpenLogin,
  onOpenCreateAccount,
  onRegisterStudent,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<CoursePackageId>('full_beginner');
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanId>('deposit_75');
  const [copiedAcct, setCopiedAcct] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [nin, setNin] = useState('');
  const [mothersMaidenName, setMothersMaidenName] = useState('');
  const [nationality, setNationality] = useState('Nigerian');
  const [stateOfOrigin, setStateOfOrigin] = useState('Jigawa');
  const [localGovernment, setLocalGovernment] = useState('');
  const [licenseClass, setLicenseClass] = useState('Class B');
  const [nextOfKin, setNextOfKin] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handlePackageSelect = (pkgId: CoursePackageId) => {
    setSelectedPackage(pkgId);
    if (pkgId === 'certificate_only') {
      setSelectedPlan('full_100');
    }
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
      setCopiedAcct(true);
      setTimeout(() => setCopiedAcct(false), 2000);
    } catch {
      setCopiedAcct(false);
    }
  };

  const activePackage = COURSE_PACKAGES[selectedPackage];
  const effectivePlan: PaymentPlanId =
    selectedPackage === 'certificate_only' ? 'full_100' : selectedPlan;
  const initialAmountDue =
    selectedPackage === 'certificate_only'
      ? activePackage.fee
      : effectivePlan === 'deposit_75'
      ? activePackage.deposit75Amount
      : activePackage.fee;
  const postOneMonthBalance = activePackage.fee - initialAmountDue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanNin = nin.replace(/\s+/g, '');
    if (!/^\d{11}$/.test(cleanNin)) {
      setFormError('Please enter a valid 11-digit National Identification Number (NIN).');
      return;
    }

    if (existingNins.includes(cleanNin)) {
      setFormError(
        'An account with this NIN Number already exists. Please use Portal Sign In to access your account.'
      );
      return;
    }

    if (password.trim().length < 5) {
      setFormError('Please create a portal password of at least 5 characters.');
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setFormError('Portal Password and Confirm Password do not match.');
      return;
    }

    onRegisterStudent({
      packageId: selectedPackage,
      paymentPlan: effectivePlan,
      totalFee: activePackage.fee,
      initialAmountDue,
      fullName: fullName.trim(),
      dateOfBirth,
      homeAddress: homeAddress.trim(),
      bloodGroup,
      nin: cleanNin,
      mothersMaidenName: mothersMaidenName.trim(),
      nationality: nationality.trim(),
      stateOfOrigin,
      localGovernment: localGovernment.trim(),
      licenseClass,
      nextOfKin: nextOfKin.trim(),
      nextOfKinPhone: nextOfKinPhone.trim(),
      password: password.trim(),
    });
  };

  return (
    <div className="relative z-10">
      {/* HERO SECTION */}
      <section id="home" className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 sm:pt-14 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 flex flex-col justify-center rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-10 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
              {SCHOOL_INFO.licensingAuthority} Accredited Center · Dutse, Jigawa State
            </div>
            <h1
              className="mt-3 font-display font-extrabold tracking-tight text-[#0A2E7A] leading-[1.08]"
              style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
            >
              Practical Road Training &amp; Official FRSC Licensing in Dutse
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              Enroll online at <strong>{SCHOOL_INFO.name}</strong> for structured classroom
              highway theory and hands-on physical driving instruction at our Dutse campus.
              Generate your instant Admission &amp; Payment Pass and begin training immediately.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                href="#enroll"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E7A] px-6 py-3 text-sm font-bold text-white hover:bg-[#082361] transition-colors whitespace-nowrap"
              >
                <span>Register / Create Account</span>
                <ArrowRight className="h-4 w-4 text-[#F5B700]" />
              </a>
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0A2E7A]/25 bg-white px-5 py-3 text-sm font-semibold text-[#0A2E7A] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Lock className="h-4 w-4" />
                <span>Portal Sign In</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateAccount}
                className="text-xs font-semibold text-[#0A2E7A] underline underline-offset-4 hover:text-[#082361] cursor-pointer whitespace-nowrap"
              >
                Staff / Instructor Sign Up
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-500">Campus Location</div>
                <div className="mt-0.5 font-semibold text-slate-900">
                  No. 12, Asmau House Kiyawa Road, Dutse
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-500">Admissions Desk</div>
                <div className="mt-0.5 font-mono-tabular font-semibold text-slate-900">
                  {SCHOOL_INFO.phone}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-500">Certificate Authority</div>
                <div className="mt-0.5 font-semibold text-[#0A2E7A]">FRSC Official Clearance</div>
              </div>
            </div>
          </div>

          {/* Right Brand Emblem & Campus Showcase Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#0A2E7A]/20 bg-white/95 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col items-center text-center">
              <div className="w-full rounded-xl border border-slate-100 bg-slate-50/70 p-6 flex items-center justify-center">
                <BrandLogo
                  logoUrl={logoUrl}
                  className="max-h-48 w-auto object-contain drop-shadow-xs"
                />
              </div>
              <h2 className="mt-5 font-display text-xl font-extrabold text-[#0A2E7A]">
                {SCHOOL_INFO.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">{SCHOOL_INFO.motto}</p>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-slate-200 pt-5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#0A2E7A] mt-0.5" />
                <span>{SCHOOL_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#0A2E7A]" />
                <span className="font-mono-tabular font-semibold">{SCHOOL_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#0A2E7A]" />
                <span>{SCHOOL_INFO.email}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 1 & STEP 2: COURSE PACKAGES & PAYMENT RULES + REGISTRATION FORM */}
      <section id="programs" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
              Online Student Registration
            </div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Choose Your Training Package &amp; Complete Enrollment
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Select your course package and payment schedule below, then fill in your official
              candidate details to receive an instant printable Admission &amp; Payment Pass.
            </p>
          </div>

          {/* STEP 1: PACKAGE SELECTION */}
          <div className="mt-8">
            <div className="text-sm font-bold text-[#0A2E7A] mb-3">
              Step 1. Select Course Package
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Package 1: Full Beginner */}
              <button
                type="button"
                onClick={() => handlePackageSelect('full_beginner')}
                className={`text-left rounded-xl border-2 p-5 transition-colors cursor-pointer ${
                  selectedPackage === 'full_beginner'
                    ? 'border-[#0A2E7A] bg-[#0A2E7A]/[0.03]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-extrabold text-slate-900">
                      {COURSE_PACKAGES.full_beginner.title}
                    </div>
                    <div className="text-xs font-semibold text-[#0A2E7A] mt-0.5">
                      {COURSE_PACKAGES.full_beginner.subtitle}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-tabular text-xl font-extrabold text-[#0A2E7A]">
                      {formatNaira(COURSE_PACKAGES.full_beginner.fee)}
                    </div>
                    <div className="text-[11px] text-slate-500">Total Tuition</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {COURSE_PACKAGES.full_beginner.description}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    Supports 75% Initial Deposit (₦48,750) or 100% Full Payment
                  </span>
                  {selectedPackage === 'full_beginner' && (
                    <CheckCircle2 className="h-5 w-5 text-[#0A2E7A] shrink-0" />
                  )}
                </div>
              </button>

              {/* Package 2: Certificate Acquisition Only */}
              <button
                type="button"
                onClick={() => handlePackageSelect('certificate_only')}
                className={`text-left rounded-xl border-2 p-5 transition-colors cursor-pointer ${
                  selectedPackage === 'certificate_only'
                    ? 'border-[#0A2E7A] bg-[#0A2E7A]/[0.03]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-extrabold text-slate-900">
                      {COURSE_PACKAGES.certificate_only.title}
                    </div>
                    <div className="text-xs font-semibold text-[#0A2E7A] mt-0.5">
                      {COURSE_PACKAGES.certificate_only.subtitle}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-tabular text-xl font-extrabold text-[#0A2E7A]">
                      {formatNaira(COURSE_PACKAGES.certificate_only.fee)}
                    </div>
                    <div className="text-[11px] text-slate-500">Fixed Fee</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {COURSE_PACKAGES.certificate_only.description}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                  <span className="text-amber-800">
                    100% Full Payment Required Upon Registration
                  </span>
                  {selectedPackage === 'certificate_only' && (
                    <CheckCircle2 className="h-5 w-5 text-[#0A2E7A] shrink-0" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: DYNAMIC PAYMENT PLAN SELECTION */}
          <div id="enroll" className="mt-8 pt-7 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-sm font-bold text-[#0A2E7A]">
                Step 2. Select Payment Plan
              </div>
              {selectedPackage === 'certificate_only' && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                  100% full payment required for Certificate Acquisition
                </div>
              )}
            </div>

            {selectedPackage === 'full_beginner' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    selectedPlan === 'deposit_75'
                      ? 'border-[#0A2E7A] bg-[#0A2E7A]/[0.04]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="deposit_75"
                    checked={selectedPlan === 'deposit_75'}
                    onChange={() => setSelectedPlan('deposit_75')}
                    className="mt-1 h-4 w-4 accent-[#0A2E7A]"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      75% Initial Deposit Plan —{' '}
                      <span className="font-mono-tabular text-[#0A2E7A]">₦48,750 Now</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Pay ₦48,750 upfront to register and begin physical campus training
                      immediately. Pay the remaining 25% balance (₦16,250) after 1 month of
                      training prior to FRSC certificate collection.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    selectedPlan === 'full_100'
                      ? 'border-[#0A2E7A] bg-[#0A2E7A]/[0.04]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="full_100"
                    checked={selectedPlan === 'full_100'}
                    onChange={() => setSelectedPlan('full_100')}
                    className="mt-1 h-4 w-4 accent-[#0A2E7A]"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      100% Full Payment Plan —{' '}
                      <span className="font-mono-tabular text-[#0A2E7A]">₦65,000 Once</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Pay ₦65,000 in full upon registration. No post-training tuition balance
                      required when collecting your FRSC certificate.
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="rounded-xl border border-[#0A2E7A] bg-[#0A2E7A]/[0.04] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked
                    readOnly
                    className="mt-1 h-4 w-4 accent-[#0A2E7A]"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      100% Full Payment Only —{' '}
                      <span className="font-mono-tabular text-[#0A2E7A]">₦13,000</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Installment deposit is unavailable for Certificate Acquisition Only. Full
                      payment of ₦13,000 is due upon registration.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-[#0A2E7A] px-3 py-1.5 text-xs font-bold text-[#F5B700]">
                  Locked: 100% Full Payment
                </span>
              </div>
            )}
          </div>

          {/* STEP 3: COMPREHENSIVE STUDENT REGISTRATION FORM */}
          <form onSubmit={handleSubmit} className="mt-8 pt-7 border-t border-slate-200 space-y-8">
            <div>
              <div className="text-sm font-bold text-[#0A2E7A] mb-4">
                Step 3. Candidate Personal Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Suleiman Garba Adamu"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Blood Group *
                  </label>
                  <select
                    required
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIN Number (11 Digits — Used for Portal Login) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                    placeholder="11-digit National ID Number"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono-tabular text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mother&apos;s Maiden Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={mothersMaidenName}
                    onChange={(e) => setMothersMaidenName(e.target.value)}
                    placeholder="Mother's surname before marriage"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Home Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="Street / House No. & Town"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>
              </div>
            </div>

            {/* Location & License Class */}
            <div>
              <div className="text-sm font-bold text-[#0A2E7A] mb-4">
                Step 4. Origin Location &amp; Driver&apos;s License Class
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State of Origin *
                  </label>
                  <select
                    required
                    value={stateOfOrigin}
                    onChange={(e) => setStateOfOrigin(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Local Government *
                  </label>
                  <input
                    type="text"
                    required
                    value={localGovernment}
                    onChange={(e) => setLocalGovernment(e.target.value)}
                    placeholder="e.g. Dutse"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Driver&apos;s License Class *
                  </label>
                  <select
                    required
                    value={licenseClass}
                    onChange={(e) => setLicenseClass(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  >
                    {LICENSE_CLASSES.map((lc) => (
                      <option key={lc.value} value={lc.value}>
                        {lc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact & Portal Security */}
            <div>
              <div className="text-sm font-bold text-[#0A2E7A] mb-4">
                Step 5. Emergency Contact &amp; Student Account Credentials
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Next of Kin *
                  </label>
                  <input
                    type="text"
                    required
                    value={nextOfKin}
                    onChange={(e) => setNextOfKin(e.target.value)}
                    placeholder="Full name of Next of Kin"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Next of Kin Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={nextOfKinPhone}
                    onChange={(e) => setNextOfKinPhone(e.target.value)}
                    placeholder="e.g. 08030435429"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono-tabular text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Create Portal Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={5}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 5 characters"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={5}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter portal password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0A2E7A] focus:outline-none focus:ring-2 focus:ring-[#0A2E7A]/20"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            {/* Summary & Submit Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#0A2E7A]/20 bg-[#0A2E7A]/[0.03] p-5">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Registration Summary
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {activePackage.title} ·{' '}
                  <span className="text-[#0A2E7A]">
                    Initial Amount Due: {formatNaira(initialAmountDue)}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono-tabular">
                  Post-1-Month Balance: {formatNaira(postOneMonthBalance)} · Total Tuition:{' '}
                  {formatNaira(activePackage.fee)}
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2E7A] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#082361] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="h-4 w-4 text-[#F5B700]" />
                <span>Submit &amp; Generate Admission Pass</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* OFFICIAL BANK PAYMENT & CAMPUS LOCATION SECTION */}
      <section id="bank-details" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-[#0A2E7A] bg-[#0A2E7A] p-6 sm:p-8 text-white">
            <div className="flex items-center gap-2.5 text-[#F5B700]">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Official Bank Account Details
              </span>
            </div>
            <h3 className="mt-2 font-display text-2xl font-extrabold">
              Pay Tuition Directly via GTBank Transfer or Deposit
            </h3>
            <p className="mt-2 text-sm text-slate-200">
              All course fees are payable strictly into the official school bank account below.
              Always include your NIN and Full Name in the payment reference.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-white/10 p-4 border border-white/15">
              <div>
                <div className="text-xs text-slate-300">Bank Name</div>
                <div className="mt-1 text-sm font-bold">{BANK_DETAILS.bankName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-300">Account Name</div>
                <div className="mt-1 text-sm font-bold">{BANK_DETAILS.accountName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-300">Account Number</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono-tabular text-lg font-extrabold text-[#F5B700]">
                    {BANK_DETAILS.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 text-xs font-semibold text-white hover:bg-white/25 cursor-pointer"
                  >
                    {copiedAcct ? <Check className="h-3 w-3 text-[#F5B700]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedAcct ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-200 font-mono-tabular">
              Required Narration Format: <strong className="text-[#F5B700]">FDS / [Student NIN] / [Full Name]</strong>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white/95 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0A2E7A]">
                Physical Campus &amp; Verification Office
              </div>
              <h3 className="mt-2 font-display text-xl font-extrabold text-slate-900">
                Present Your Receipt on Campus
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                After completing registration and your GTBank payment, present your printed
                Admission &amp; Payment Pass along with your payment receipt at our Dutse office to
                begin classroom theory and driving sessions.
              </p>
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <div className="flex items-start gap-2.5 text-slate-800">
                <MapPin className="h-4 w-4 shrink-0 text-[#0A2E7A] mt-1" />
                <span className="font-medium">{SCHOOL_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-800">
                <Phone className="h-4 w-4 shrink-0 text-[#0A2E7A]" />
                <span className="font-mono-tabular font-semibold">{SCHOOL_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-800">
                <Mail className="h-4 w-4 shrink-0 text-[#0A2E7A]" />
                <span>{SCHOOL_INFO.email}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
