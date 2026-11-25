export type CoursePackageId = 'full_beginner' | 'certificate_only';
export type PaymentPlanId = 'deposit_75' | 'full_100';
export type UserRole = 'student' | 'instructor' | 'admin';
export type AuthMode = 'signin' | 'signup';
export type PrintableDocType = 'admission_pass' | 'tuition_receipt' | 'frsc_clearance';

export interface PracticalScores {
  steering: number;
  parking: number;
  roadSigns: number;
  defensiveDriving: number;
}

export interface StudentRecord {
  id: string;
  receiptNumber: string;
  clearanceNumber: string;
  registeredAt: string; // ISO date string
  packageId: CoursePackageId;
  paymentPlan: PaymentPlanId;
  totalFee: number;
  initialAmountDue: number;
  amountPaid: number;
  initialDepositVerified: boolean;
  finalBalanceVerified: boolean;
  paymentVerifiedAt?: string;

  // Personal Details
  fullName: string;
  dateOfBirth: string;
  homeAddress: string;
  bloodGroup: string;
  nin: string;
  mothersMaidenName: string;

  // Location Details
  nationality: string;
  stateOfOrigin: string;
  localGovernment: string;

  // License & Emergency
  licenseClass: string;
  nextOfKin: string;
  nextOfKinPhone: string;

  // Instructor Training & Assessment
  attendanceSessions: number;
  totalRequiredSessions: number;
  theoryScore: number;
  practicalScores: PracticalScores;
  instructorFeedback: string;
  oneMonthTrainingCompleted: boolean;
  trainingCompletedAt?: string;
}

export interface InstructorAccount {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface AuthSession {
  role: UserRole;
  studentId?: string;
  staffId?: string;
  email?: string;
  specialty?: string;
  phone?: string;
  displayName: string;
}

export interface AppConfig {
  supabaseConfigured: boolean;
  supabaseUrl: string;
  supabasePublishableKey: string;
  schoolLogo: string;
}

export const STAFF_ACCESS_CODES = {
  instructor: 'FUSAHA-INST',
  admin: 'FUSAHA-ADMIN',
} as const;

export const DEFAULT_LOGO_PATH = '/assets/aistudio/Fusaha_Driving_School_Emblem_b62ab66b.png';

export const SCHOOL_INFO = {
  name: 'FUSAHA DRIVING SCHOOL',
  address: 'No. 12, Asmau House Kiyawa Road, Dutse, Jigawa State',
  phone: '08030435429',
  email: 'lawankudai@gmail.com',
  licensingAuthority: 'FEDERAL ROAD SAFETY COMMISSION (FRSC)',
  motto: 'Driving Skills, Safety and Confidence.',
} as const;

export const BANK_DETAILS = {
  bankName: 'GTBANK (Guaranty Trust Bank)',
  shortBankName: 'GTBANK',
  accountName: 'LAWAL SHUAIBU',
  accountNumber: '0045575285',
} as const;

export const COURSE_PACKAGES = {
  full_beginner: {
    id: 'full_beginner' as CoursePackageId,
    title: 'Full Beginner Training Package',
    subtitle: 'Theory + Physical Campus Driving',
    fee: 65000,
    deposit75Amount: 48750,
    balance25Amount: 16250,
    description:
      'Complete 1-month physical classroom theory and behind-the-wheel practical driving sessions at our Dutse campus, preparing you for FRSC certification.',
  },
  certificate_only: {
    id: 'certificate_only' as CoursePackageId,
    title: 'Certificate Acquisition Only',
    subtitle: 'Theory Verification & FRSC Clearance',
    fee: 13000,
    deposit75Amount: 13000,
    balance25Amount: 0,
    description:
      'Designed for experienced drivers seeking formal theory verification, road sign assessment, and official FRSC Driving School Certificate clearance.',
  },
} as const;

export const LICENSE_CLASSES = [
  { value: 'Class A', label: 'Class A — Motorcycle' },
  { value: 'Class B', label: 'Class B — Motor Vehicle (Up to 3 Tonnes / Private Car)' },
  { value: 'Class C', label: 'Class C — Motor Vehicle (Light Commercial / Pick-up)' },
  { value: 'Class D', label: 'Class D — Agricultural / Tractor & Earth-Moving' },
  { value: 'Class E', label: 'Class E — Heavy Motor Vehicle (Trucks & Lorries)' },
  { value: 'Class F', label: 'Class F — Heavy Articulated Vehicle / Trailer' },
  { value: 'Class G', label: 'Class G — Passenger Bus / Commercial Transit' },
  { value: 'Class H', label: 'Class H — Earth-Moving & Construction Plant' },
  { value: 'Class I', label: 'Class I — Special Purpose / Industrial Vehicle' },
  { value: 'Class J', label: 'Class J — Disabled Persons Adapted Vehicle' },
  { value: 'Class V', label: 'Class V — Diplomatic / Special Official Category' },
] as const;

export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

export const NIGERIAN_STATES = [
  'Jigawa',
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
] as const;

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function getPaymentReference(student: Pick<StudentRecord, 'nin' | 'fullName'>): string {
  return `FDS / ${student.nin.trim()} / ${student.fullName.trim().toUpperCase()}`;
}

export function getDaysSinceRegistration(registeredAt: string): number {
  const start = new Date(registeredAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

export function getClearanceCountdownDays(registeredAt: string): number {
  const elapsed = getDaysSinceRegistration(registeredAt);
  return Math.max(0, 30 - elapsed);
}

export function isFullyPaid(student: StudentRecord): boolean {
  return (
    student.amountPaid >= student.totalFee &&
    (student.paymentPlan === 'full_100'
      ? student.initialDepositVerified
      : student.finalBalanceVerified)
  );
}

export function isFrscEligible(student: StudentRecord): boolean {
  return student.oneMonthTrainingCompleted && isFullyPaid(student);
}
