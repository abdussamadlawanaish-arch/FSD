import { AuthSession, DEFAULT_LOGO_PATH, StudentRecord } from './types';

const STUDENTS_KEY = 'fusaha_students_v1';
const LOGO_KEY = 'fusaha_school_logo_v1';
const SESSION_KEY = 'fusaha_session_v1';

const daysAgoIso = (days: number): string => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
};

export const DEMO_STUDENTS: StudentRecord[] = [
  {
    id: 'FDS-2026-001',
    receiptNumber: 'RCT-FDS-2026-001',
    clearanceNumber: 'FRSC-JIG-FDS-001',
    registeredAt: daysAgoIso(18),
    packageId: 'full_beginner',
    paymentPlan: 'deposit_75',
    totalFee: 65000,
    initialAmountDue: 48750,
    amountPaid: 48750,
    initialDepositVerified: true,
    finalBalanceVerified: false,
    paymentVerifiedAt: daysAgoIso(17),

    fullName: 'Ibrahim Musa Dutse',
    dateOfBirth: '1999-05-14',
    homeAddress: 'Plot 14, Takur Quarters, Dutse, Jigawa State',
    bloodGroup: 'O+',
    nin: '23456789012',
    mothersMaidenName: 'Halima Garba',

    nationality: 'Nigerian',
    stateOfOrigin: 'Jigawa',
    localGovernment: 'Dutse',

    licenseClass: 'Class B',
    nextOfKin: 'Musa Abdullahi Dutse',
    nextOfKinPhone: '08061234567',

    password: 'student123',

    attendanceSessions: 12,
    totalRequiredSessions: 20,
    theoryScore: 84,
    practicalScores: {
      steering: 82,
      parking: 76,
      roadSigns: 88,
      defensiveDriving: 80,
    },
    instructorFeedback:
      'Demonstrates steady steering control and strong knowledge of highway signs. Continue practicing parallel parking ahead of the 1-month assessment.',
    oneMonthTrainingCompleted: false,
  },
  {
    id: 'FDS-2026-002',
    receiptNumber: 'RCT-FDS-2026-002',
    clearanceNumber: 'FRSC-JIG-FDS-002',
    registeredAt: daysAgoIso(34),
    packageId: 'full_beginner',
    paymentPlan: 'full_100',
    totalFee: 65000,
    initialAmountDue: 65000,
    amountPaid: 65000,
    initialDepositVerified: true,
    finalBalanceVerified: true,
    paymentVerifiedAt: daysAgoIso(33),

    fullName: 'Aisha Bello Kiyawa',
    dateOfBirth: '2001-09-22',
    homeAddress: 'No. 8, Shuwarin Layout, Kiyawa Road, Dutse, Jigawa State',
    bloodGroup: 'A+',
    nin: '34567890123',
    mothersMaidenName: 'Zainab Umar',

    nationality: 'Nigerian',
    stateOfOrigin: 'Jigawa',
    localGovernment: 'Kiyawa',

    licenseClass: 'Class B',
    nextOfKin: 'Bello Danjuma',
    nextOfKinPhone: '08039876543',

    password: 'student123',

    attendanceSessions: 20,
    totalRequiredSessions: 20,
    theoryScore: 94,
    practicalScores: {
      steering: 92,
      parking: 90,
      roadSigns: 96,
      defensiveDriving: 91,
    },
    instructorFeedback:
      'Completed full 1-month campus training with excellent defensive driving discipline and road rule accuracy. Recommended for FRSC licensing clearance.',
    oneMonthTrainingCompleted: true,
    trainingCompletedAt: daysAgoIso(2),
  },
];

export function loadStudents(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEMO_STUDENTS));
      return DEMO_STUDENTS;
    }
    const parsed = JSON.parse(raw) as StudentRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEMO_STUDENTS));
      return DEMO_STUDENTS;
    }
    return parsed;
  } catch {
    return DEMO_STUDENTS;
  }
}

export function saveStudents(students: StudentRecord[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadLogoUrl(): string {
  try {
    const stored = localStorage.getItem(LOGO_KEY);
    return stored && stored.trim().length > 0 ? stored : DEFAULT_LOGO_PATH;
  } catch {
    return DEFAULT_LOGO_PATH;
  }
}

export function saveLogoUrl(dataUrl: string | null): string {
  try {
    if (!dataUrl) {
      localStorage.removeItem(LOGO_KEY);
      return DEFAULT_LOGO_PATH;
    }
    localStorage.setItem(LOGO_KEY, dataUrl);
    return dataUrl;
  } catch {
    return dataUrl || DEFAULT_LOGO_PATH;
  }
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

export function generateNextStudentId(existing: StudentRecord[]): string {
  const year = new Date().getFullYear();
  let maxNum = existing.length;
  for (const s of existing) {
    const parts = s.id.split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(last) && last > maxNum) {
      maxNum = last;
    }
  }
  const next = String(maxNum + 1).padStart(3, '0');
  return `FDS-${year}-${next}`;
}
