import { ACCESS_CODES, supabase } from './supabaseClient';
import {
  AdminAccount,
  AuthSession,
  CoursePackageId,
  DEFAULT_LOGO_PATH,
  InstructorAccount,
  PaymentPlanId,
  PracticalScores,
  StudentRecord,
  UserRole,
} from './types';

export interface StudentRegistrationPayload {
  packageId: CoursePackageId;
  paymentPlan: PaymentPlanId;
  fullName: string;
  dateOfBirth: string;
  homeAddress: string;
  bloodGroup: string;
  nin: string;
  mothersMaidenName: string;
  nationality: string;
  stateOfOrigin: string;
  localGovernment: string;
  licenseClass: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  password: string;
}

export interface StaffRegistrationPayload {
  role: 'instructor' | 'admin';
  fullName: string;
  email: string;
  phone: string;
  accessCode: string;
  password: string;
  staffId?: string;
  specialty?: string;
}

interface StoredStudentRecord extends StudentRecord {
  passwordHash: string;
}

interface StoredStaffAccount {
  id: string;
  role: 'instructor' | 'admin';
  staffId?: string;
  fullName: string;
  email: string;
  phone: string;
  specialty?: string;
  passwordHash: string;
  createdAt: string;
}

const daysAgoIso = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(plain: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return `pbkdf2:${bytesToHex(saltBytes)}:${bytesToHex(new Uint8Array(derived))}`;
}

async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  if (!storedHash.startsWith('pbkdf2:')) {
    return plain === storedHash;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  const [, saltHex, expectedHex] = parts;
  if (!saltHex || !expectedHex) return false;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const actualHex = bytesToHex(new Uint8Array(derived));
  if (actualHex.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHex.length; i++) {
    diff |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

function sanitizeStudent(student: StoredStudentRecord): StudentRecord {
  const { passwordHash: _omit, ...rest } = student;
  return rest;
}

function sanitizeStaff(staff: StoredStaffAccount): InstructorAccount | AdminAccount {
  const { passwordHash: _omit, role: _role, ...rest } = staff;
  return rest;
}

async function createSeedStudents(): Promise<StoredStudentRecord[]> {
  const demoPassHash = await hashPassword('student123');
  return [
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
      passwordHash: demoPassHash,
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
      passwordHash: demoPassHash,
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
}

async function createSeedStaff(): Promise<StoredStaffAccount[]> {
  const [instHash, adminHash] = await Promise.all([
    hashPassword('inst123'),
    hashPassword('admin123'),
  ]);
  return [
    {
      id: 'INST-ACC-001',
      role: 'instructor',
      staffId: 'INST-FDS-001',
      fullName: 'Lawal Kudai',
      email: 'instructor@fusaha.com',
      phone: '08030435429',
      specialty: 'Class B, Class C & Class E',
      passwordHash: instHash,
      createdAt: daysAgoIso(90),
    },
    {
      id: 'ADM-ACC-001',
      role: 'admin',
      fullName: 'Lawal Shuaibu',
      email: 'admin@fusaha.com',
      phone: '08030435429',
      passwordHash: adminHash,
      createdAt: daysAgoIso(120),
    },
  ];
}

async function getAllRawStudents(): Promise<StoredStudentRecord[]> {
  const { data, error } = await supabase.from('students').select('id, data');
  if (error) {
    throw new Error(`Supabase students read error: ${error.message}`);
  }
  if (!data || data.length === 0) {
    const seeds = await createSeedStudents();
    const { error: seedError } = await supabase.from('students').upsert(
      seeds.map((s) => ({ id: s.id, data: s })),
      { onConflict: 'id' }
    );
    if (seedError) {
      throw new Error(`Supabase students seed error: ${seedError.message}`);
    }
    return seeds;
  }
  return data.map((row) => row.data as StoredStudentRecord);
}

async function getAllRawStaff(): Promise<StoredStaffAccount[]> {
  const { data, error } = await supabase.from('staff').select('id, data');
  if (error) {
    throw new Error(`Supabase staff read error: ${error.message}`);
  }
  if (!data || data.length === 0) {
    const seeds = await createSeedStaff();
    const { error: seedError } = await supabase.from('staff').upsert(
      seeds.map((s) => ({ id: s.id, data: s })),
      { onConflict: 'id' }
    );
    if (seedError) {
      throw new Error(`Supabase staff seed error: ${seedError.message}`);
    }
    return seeds;
  }
  return data.map((row) => row.data as StoredStaffAccount);
}

function generateNextStudentId(existing: StoredStudentRecord[]): string {
  const year = new Date().getFullYear();
  let maxNum = existing.length;
  for (const s of existing) {
    const parts = s.id.split('-');
    const last = parseInt(parts[parts.length - 1] || '0', 10);
    if (!Number.isNaN(last) && last > maxNum) {
      maxNum = last;
    }
  }
  return `FDS-${year}-${String(maxNum + 1).padStart(3, '0')}`;
}

export async function fetchSchoolLogo(): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'school_logo')
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase settings read error: ${error.message}`);
  }
  return data?.value || DEFAULT_LOGO_PATH;
}

export async function updateSchoolLogoInSupabase(logoUrl: string): Promise<string> {
  const nextLogo = logoUrl.trim() === '' ? DEFAULT_LOGO_PATH : logoUrl.trim();
  const isAllowedDefault = nextLogo === DEFAULT_LOGO_PATH;
  const isAllowedDataImage = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(
    nextLogo
  );
  if (!isAllowedDefault && !isAllowedDataImage) {
    throw new Error('Invalid image format for school logo.');
  }
  if (nextLogo.length > 4_500_000) {
    throw new Error('Logo image exceeds maximum 3MB size limit.');
  }

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'school_logo', value: nextLogo }, { onConflict: 'key' });
  if (error) {
    throw new Error(`Supabase settings write error: ${error.message}`);
  }
  return nextLogo;
}

export async function loginWithCredentials(params: {
  role: UserRole;
  identifier: string;
  password: string;
}): Promise<{ session: AuthSession; student?: StudentRecord }> {
  const identifier = params.identifier.trim();
  const password = params.password.trim();

  if (params.role === 'student') {
    const students = await getAllRawStudents();
    const candidates = students.filter(
      (s) => s.nin.trim() === identifier || s.id.toLowerCase() === identifier.toLowerCase()
    );
    for (const match of candidates) {
      const ok = await verifyPassword(password, match.passwordHash);
      if (ok) {
        return {
          session: {
            role: 'student',
            studentId: match.id,
            displayName: match.fullName,
          },
          student: sanitizeStudent(match),
        };
      }
    }
    throw new Error(
      'No matching student found. Check your NIN Number (or Student ID) and password.'
    );
  }

  const staffList = await getAllRawStaff();
  const candidates = staffList.filter(
    (st) => st.role === params.role && st.email.toLowerCase() === identifier.toLowerCase()
  );
  for (const match of candidates) {
    const ok = await verifyPassword(password, match.passwordHash);
    if (ok) {
      return {
        session: {
          role: params.role,
          displayName: match.fullName,
          staffId: match.staffId,
          email: match.email,
          specialty: match.specialty,
          phone: match.phone,
        },
      };
    }
  }
  throw new Error(
    `Invalid ${params.role === 'admin' ? 'Admin' : 'Instructor'} email or password.`
  );
}

export async function registerStudentAccount(
  payload: StudentRegistrationPayload
): Promise<{ session: AuthSession; student: StudentRecord }> {
  const cleanNin = payload.nin.replace(/\s+/g, '');
  if (!/^\d{11}$/.test(cleanNin)) {
    throw new Error('Please provide a valid 11-digit NIN Number.');
  }
  if (payload.password.trim().length < 5) {
    throw new Error('Password must be at least 5 characters.');
  }

  const existing = await getAllRawStudents();
  if (existing.some((s) => s.nin === cleanNin)) {
    throw new Error(
      'An account with this NIN Number already exists. Please use Portal Sign In instead.'
    );
  }

  const totalFee = payload.packageId === 'certificate_only' ? 13000 : 65000;
  const enforcedPlan: PaymentPlanId =
    payload.packageId === 'certificate_only'
      ? 'full_100'
      : payload.paymentPlan === 'full_100'
      ? 'full_100'
      : 'deposit_75';
  const initialAmountDue =
    payload.packageId === 'certificate_only'
      ? 13000
      : enforcedPlan === 'deposit_75'
      ? 48750
      : 65000;

  const nextId = generateNextStudentId(existing);
  const suffix = nextId.split('-').pop() || '001';
  const passwordHash = await hashPassword(payload.password.trim());

  const newStudent: StoredStudentRecord = {
    id: nextId,
    receiptNumber: `RCT-${nextId}`,
    clearanceNumber: `FRSC-JIG-FDS-${suffix}`,
    registeredAt: new Date().toISOString(),
    packageId: payload.packageId,
    paymentPlan: enforcedPlan,
    totalFee,
    initialAmountDue,
    amountPaid: 0,
    initialDepositVerified: false,
    finalBalanceVerified: false,
    fullName: payload.fullName.trim(),
    dateOfBirth: payload.dateOfBirth.trim(),
    homeAddress: payload.homeAddress.trim(),
    bloodGroup: payload.bloodGroup.trim(),
    nin: cleanNin,
    mothersMaidenName: payload.mothersMaidenName.trim(),
    nationality: payload.nationality.trim(),
    stateOfOrigin: payload.stateOfOrigin.trim(),
    localGovernment: payload.localGovernment.trim(),
    licenseClass: payload.licenseClass.trim(),
    nextOfKin: payload.nextOfKin.trim(),
    nextOfKinPhone: payload.nextOfKinPhone.trim(),
    passwordHash,
    attendanceSessions: 0,
    totalRequiredSessions: 20,
    theoryScore: 0,
    practicalScores: {
      steering: 0,
      parking: 0,
      roadSigns: 0,
      defensiveDriving: 0,
    },
    instructorFeedback:
      'Newly enrolled student. Present your Admission & Payment Pass with GTBank receipt at the Dutse campus office to begin physical training.',
    oneMonthTrainingCompleted: false,
  };

  const { error } = await supabase
    .from('students')
    .upsert({ id: newStudent.id, data: newStudent }, { onConflict: 'id' });
  if (error) {
    throw new Error(`Supabase student registration error: ${error.message}`);
  }

  return {
    session: {
      role: 'student',
      studentId: newStudent.id,
      displayName: newStudent.fullName,
    },
    student: sanitizeStudent(newStudent),
  };
}

export async function registerStaffAccount(
  payload: StaffRegistrationPayload
): Promise<{ session: AuthSession }> {
  const expectedCode =
    payload.role === 'instructor'
      ? ACCESS_CODES.INSTRUCTOR_ACCESS_CODE
      : ACCESS_CODES.ADMIN_ACCESS_CODE;

  if (payload.accessCode.trim().toUpperCase() !== expectedCode) {
    throw new Error(
      `Invalid ${payload.role === 'instructor' ? 'Staff Access' : 'Admin Authorization'} Code.`
    );
  }

  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanStaffId = payload.staffId?.trim().toUpperCase();
  const existingStaff = await getAllRawStaff();

  if (existingStaff.some((s) => s.email.toLowerCase() === cleanEmail)) {
    throw new Error('A staff account with this email address already exists. Please Sign In.');
  }
  if (
    payload.role === 'instructor' &&
    cleanStaffId &&
    existingStaff.some((s) => s.staffId?.toLowerCase() === cleanStaffId.toLowerCase())
  ) {
    throw new Error('This Staff / Instructor ID is already registered.');
  }

  const countForRole = existingStaff.filter((s) => s.role === payload.role).length;
  const passwordHash = await hashPassword(payload.password.trim());

  const newStaff: StoredStaffAccount = {
    id: `${payload.role === 'instructor' ? 'INST' : 'ADM'}-ACC-${String(
      countForRole + 1
    ).padStart(3, '0')}`,
    role: payload.role,
    fullName: payload.fullName.trim(),
    email: cleanEmail,
    phone: payload.phone.trim(),
    staffId: payload.role === 'instructor' ? cleanStaffId : undefined,
    specialty: payload.role === 'instructor' ? payload.specialty?.trim() : undefined,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('staff')
    .upsert({ id: newStaff.id, data: newStaff }, { onConflict: 'id' });
  if (error) {
    throw new Error(`Supabase staff registration error: ${error.message}`);
  }

  return {
    session: {
      role: payload.role,
      displayName: newStaff.fullName,
      staffId: newStaff.staffId,
      email: newStaff.email,
      specialty: newStaff.specialty,
      phone: newStaff.phone,
    },
  };
}

export async function fetchStudents(session: AuthSession): Promise<StudentRecord[]> {
  const allStudents = await getAllRawStudents();
  if (session.role === 'student') {
    return allStudents.filter((s) => s.id === session.studentId).map(sanitizeStudent);
  }
  return allStudents.map(sanitizeStudent);
}

export async function updateStudentAssessment(
  studentId: string,
  patch: {
    attendanceSessions?: number;
    theoryScore?: number;
    practicalScores?: PracticalScores;
    instructorFeedback?: string;
    oneMonthTrainingCompleted?: boolean;
  }
): Promise<StudentRecord> {
  const allStudents = await getAllRawStudents();
  const existing = allStudents.find((s) => s.id === studentId);
  if (!existing) {
    throw new Error('Student record not found.');
  }

  const updated: StoredStudentRecord = { ...existing };
  if (typeof patch.attendanceSessions === 'number') {
    updated.attendanceSessions = Math.min(
      existing.totalRequiredSessions,
      Math.max(0, Math.round(patch.attendanceSessions))
    );
  }
  if (typeof patch.theoryScore === 'number') {
    updated.theoryScore = Math.min(100, Math.max(0, Math.round(patch.theoryScore)));
  }
  if (patch.practicalScores) {
    updated.practicalScores = {
      steering: Math.min(100, Math.max(0, Math.round(Number(patch.practicalScores.steering) || 0))),
      parking: Math.min(100, Math.max(0, Math.round(Number(patch.practicalScores.parking) || 0))),
      roadSigns: Math.min(100, Math.max(0, Math.round(Number(patch.practicalScores.roadSigns) || 0))),
      defensiveDriving: Math.min(
        100,
        Math.max(0, Math.round(Number(patch.practicalScores.defensiveDriving) || 0))
      ),
    };
  }
  if (typeof patch.instructorFeedback === 'string') {
    updated.instructorFeedback = patch.instructorFeedback.slice(0, 1000);
  }
  if (typeof patch.oneMonthTrainingCompleted === 'boolean') {
    updated.oneMonthTrainingCompleted = patch.oneMonthTrainingCompleted;
    updated.trainingCompletedAt = patch.oneMonthTrainingCompleted
      ? existing.trainingCompletedAt || new Date().toISOString()
      : undefined;
  }

  const { error } = await supabase
    .from('students')
    .upsert({ id: updated.id, data: updated }, { onConflict: 'id' });
  if (error) {
    throw new Error(`Supabase assessment update error: ${error.message}`);
  }

  return sanitizeStudent(updated);
}

export async function verifyStudentPayment(
  studentId: string,
  verifyAction: 'initial' | 'final_25'
): Promise<StudentRecord> {
  const allStudents = await getAllRawStudents();
  const existing = allStudents.find((s) => s.id === studentId);
  if (!existing) {
    throw new Error('Student record not found.');
  }

  const updated: StoredStudentRecord = { ...existing };
  if (verifyAction === 'initial') {
    updated.initialDepositVerified = true;
    updated.amountPaid = existing.initialAmountDue;
    updated.finalBalanceVerified = existing.paymentPlan === 'full_100';
    updated.paymentVerifiedAt = new Date().toISOString();
  } else if (verifyAction === 'final_25') {
    updated.initialDepositVerified = true;
    updated.finalBalanceVerified = true;
    updated.amountPaid = existing.totalFee;
    updated.paymentVerifiedAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from('students')
    .upsert({ id: updated.id, data: updated }, { onConflict: 'id' });
  if (error) {
    throw new Error(`Supabase payment verification error: ${error.message}`);
  }

  return sanitizeStudent(updated);
}

export async function fetchStaffDirectory(): Promise<{
  instructors: InstructorAccount[];
  admins: AdminAccount[];
}> {
  const staff = await getAllRawStaff();
  return {
    instructors: staff
      .filter((s) => s.role === 'instructor')
      .map((s) => sanitizeStaff(s) as InstructorAccount),
    admins: staff
      .filter((s) => s.role === 'admin')
      .map((s) => sanitizeStaff(s) as AdminAccount),
  };
}
