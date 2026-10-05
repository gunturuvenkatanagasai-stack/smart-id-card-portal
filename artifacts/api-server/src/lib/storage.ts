import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getStorageFilePath(): string {
  if (process.env.STORAGE_FILE) return path.resolve(process.env.STORAGE_FILE);
  const candidates = [
    path.resolve(process.cwd(), "artifacts/api-server/data/portal-storage.json"),
    path.resolve(process.cwd(), "artifacts/data/portal-storage.json"),
    path.resolve(__dirname, "../../data/portal-storage.json"),
    path.resolve(__dirname, "../data/portal-storage.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]!;
}

const STORAGE_FILE = getStorageFilePath();
const DATA_DIR = path.dirname(STORAGE_FILE);

export type StudentRecord = {
  id: number;
  email: string;
  studentName: string;
  registerNumber: string;
  branch: string;
  year: string;
  semester: string;
  mobileNumber: string;
  createdAt: string;
};

export type RequestRecord = {
  id: number;
  requestNumber: string;
  studentName: string;
  registerNumber: string;
  branch: string;
  year: string;
  semester: string;
  section: string | null;
  mobileNumber: string;
  email: string;
  reason: string;
  dateOfLoss: string | null;
  locationOfLoss: string | null;
  additionalRemarks: string | null;
  status: string;
  hodNote: string | null;
  hodApprovedAt: string | null;
  hodApprovedBy: string | null;
  principalNote: string | null;
  principalApprovedAt: string | null;
  principalApprovedBy: string | null;
  adminNote: string | null;
  adminVerifiedAt: string | null;
  paymentId: string | null;
  paymentMethod: string | null;
  paymentAmount: string | null;
  paidAt: string | null;
  collectedAt: string | null;
  collectedByStaff: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogRecord = {
  id: number;
  requestNumber: string;
  user: string;
  role: string;
  action: string;
  remarks: string | null;
  createdAt: string;
};

export type NotificationRecord = {
  id: number;
  email: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export type OtpRecord = {
  id: number;
  email: string;
  otp: string; // SHA-256 hashed
  used: boolean;
  attempts: number;
  lockedUntil: string | null;
  expiresAt: string;
  createdAt: string;
};

export type StaffUserRecord = {
  id: number;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "STUDENT" | "HOD" | "PRINCIPAL" | "ADMIN" | "ID_CARD_STAFF" | "SUPER_ADMIN";
  department: string | null;
  isActive: boolean;
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PortalStorageData = {
  students: Record<string, StudentRecord>;
  requests: RequestRecord[];
  auditLogs: AuditLogRecord[];
  notifications: NotificationRecord[];
  otps: OtpRecord[];
  staffUsers?: Record<string, StaffUserRecord>;
  counters: {
    requestId: number;
    auditId: number;
    notifId: number;
    otpId: number;
    studentId: number;
    staffId?: number;
  };
};

const defaultHodPassHash = bcrypt.hashSync(process.env.HOD_PASSWORD || "HodPassword123!", 10);
const defaultPrincipalPassHash = bcrypt.hashSync(process.env.PRINCIPAL_PASSWORD || "PrincipalPassword123!", 10);
const defaultAdminPassHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "AdminPassword123!", 10);
const defaultSuperAdminPassHash = bcrypt.hashSync(process.env.SUPER_ADMIN_PASSWORD || "SuperAdminPass123!", 10);

const DEFAULT_STAFF_USERS: Record<string, StaffUserRecord> = {
  "hod_cse": {
    id: 1,
    name: "Dr. K. Rama Krishna",
    username: "hod_cse",
    email: "hod.cse@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "CSE",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_it": {
    id: 2,
    name: "Dr. Anurudha",
    username: "hod_it",
    email: "hod.it@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "IT",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_ece": {
    id: 3,
    name: "Dr. M. Sateesh",
    username: "hod_ece",
    email: "hod.ece@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "ECE",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_eee": {
    id: 4,
    name: "Dr. T. V. L. N. Rao",
    username: "hod_eee",
    email: "hod.eee@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "EEE",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_mech": {
    id: 5,
    name: "Dr. D. Prasad",
    username: "hod_mech",
    email: "hod.mech@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "MECHANICAL",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_civil": {
    id: 6,
    name: "Dr. P. V. S. R. Sharma",
    username: "hod_civil",
    email: "hod.civil@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "CIVIL",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_aids": {
    id: 10,
    name: "Dr. B. Lakshmi",
    username: "hod_AIDS",
    email: "hod.aids@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "AIDS",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "hod_aiml": {
    id: 11,
    name: "Dr. S. V. Srinivas",
    username: "hod_AIML",
    email: "hod.aiml@mictech.edu.in",
    passwordHash: defaultHodPassHash,
    role: "HOD",
    department: "AIML",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "principal": {
    id: 7,
    name: "Dr. T. Vamsi Kiran",
    username: "principal",
    email: "principal@mictech.edu.in",
    passwordHash: defaultPrincipalPassHash,
    role: "PRINCIPAL",
    department: "ALL",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "admin": {
    id: 8,
    name: "ID Card Department Admin",
    username: "admin",
    email: "admin@mictech.edu.in",
    passwordHash: defaultAdminPassHash,
    role: "ADMIN",
    department: "ALL",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "superadmin": {
    id: 9,
    name: "Super Administrator",
    username: "superadmin",
    email: "superadmin@mictech.edu.in",
    passwordHash: defaultSuperAdminPassHash,
    role: "SUPER_ADMIN",
    department: "ALL",
    isActive: true,
    resetToken: null,
    resetTokenExpiresAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const DEFAULT_STUDENTS: Record<string, StudentRecord> = {
  "gunturuvenkatanagasai@mictech.edu.in": {
    id: 3,
    email: "gunturuvenkatanagasai@mictech.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543211",
    createdAt: new Date().toISOString(),
  },
  "gunturvenkatanagasai@mictech.edu.in": {
    id: 30,
    email: "gunturvenkatanagasai@mictech.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543211",
    createdAt: new Date().toISOString(),
  },
  "24h71a1286@mictech.edu.in": {
    id: 31,
    email: "24h71a1286@mictech.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543211",
    createdAt: new Date().toISOString(),
  },
  "24h71a1286@mic.edu.in": {
    id: 32,
    email: "24h71a1286@mic.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543211",
    createdAt: new Date().toISOString(),
  },
  "student@mic.edu.in": {
    id: 1,
    email: "student@mic.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543210",
    createdAt: new Date().toISOString(),
  },
  "student@mictech.edu.in": {
    id: 2,
    email: "student@mictech.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543210",
    createdAt: new Date().toISOString(),
  },
  "21bce1234@mic.edu.in": {
    id: 4,
    email: "21bce1234@mic.edu.in",
    studentName: "Rajesh Kumar",
    registerNumber: "21BCE1234",
    branch: "Computer Science",
    year: "3",
    semester: "6",
    mobileNumber: "9123456789",
    createdAt: new Date().toISOString(),
  },
  "21bce1234@mictech.edu.in": {
    id: 5,
    email: "21bce1234@mictech.edu.in",
    studentName: "Rajesh Kumar",
    registerNumber: "21BCE1234",
    branch: "Computer Science",
    year: "3",
    semester: "6",
    mobileNumber: "9123456789",
    createdAt: new Date().toISOString(),
  },
  "john.doe@mic.edu.in": {
    id: 6,
    email: "john.doe@mic.edu.in",
    studentName: "John Doe",
    registerNumber: "22ECE5678",
    branch: "Electronics",
    year: "2",
    semester: "4",
    mobileNumber: "9988776655",
    createdAt: new Date().toISOString(),
  },
  "john.doe@mictech.edu.in": {
    id: 7,
    email: "john.doe@mictech.edu.in",
    studentName: "John Doe",
    registerNumber: "22ECE5678",
    branch: "Electronics",
    year: "2",
    semester: "4",
    mobileNumber: "9988776655",
    createdAt: new Date().toISOString(),
  },
};

class PortalStorage {
  private data: PortalStorageData;

  constructor() {
    this.data = this.loadData();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error("Failed to create data directory:", err);
      }
    }
  }

  private loadData(): PortalStorageData {
    this.ensureDir();
    if (fs.existsSync(STORAGE_FILE)) {
      try {
        const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const loadedStaff: Record<string, StaffUserRecord> = { ...DEFAULT_STAFF_USERS };
        if (parsed.staffUsers && typeof parsed.staffUsers === "object") {
          for (const [key, val] of Object.entries(parsed.staffUsers as Record<string, StaffUserRecord>)) {
            loadedStaff[key] = {
              ...(loadedStaff[key] || {}),
              ...val,
            };
          }
        }

        return {
          students: { ...DEFAULT_STUDENTS, ...(parsed.students || {}) },
          requests: parsed.requests || [],
          auditLogs: parsed.auditLogs || [],
          notifications: parsed.notifications || [],
          otps: parsed.otps || [],
          staffUsers: loadedStaff,
          counters: {
            requestId: parsed.counters?.requestId || (parsed.requests?.length ? Math.max(...parsed.requests.map((r: any) => r.id)) + 1 : 1),
            auditId: parsed.counters?.auditId || (parsed.auditLogs?.length ? Math.max(...parsed.auditLogs.map((a: any) => a.id)) + 1 : 1),
            notifId: parsed.counters?.notifId || (parsed.notifications?.length ? Math.max(...parsed.notifications.map((n: any) => n.id)) + 1 : 1),
            otpId: parsed.counters?.otpId || (parsed.otps?.length ? Math.max(...parsed.otps.map((o: any) => o.id)) + 1 : 1),
            studentId: parsed.counters?.studentId || 50,
            staffId: parsed.counters?.staffId || (Object.values(loadedStaff).length ? Math.max(...Object.values(loadedStaff).map((s: any) => s.id || 0)) + 1 : 20),
          },
        };
      } catch (err) {
        console.error("Failed to read storage file, initializing default:", err);
      }
    }

    const initial: PortalStorageData = {
      students: { ...DEFAULT_STUDENTS },
      requests: [],
      auditLogs: [],
      notifications: [],
      otps: [],
      staffUsers: { ...DEFAULT_STAFF_USERS },
      counters: {
        requestId: 1,
        auditId: 1,
        notifId: 1,
        otpId: 1,
        studentId: 50,
        staffId: 20,
      },
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: PortalStorageData = this.data) {
    this.ensureDir();
    try {
      const tempPath = `${STORAGE_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tempPath, STORAGE_FILE);
    } catch (err) {
      console.error("Failed to persist portal storage to disk:", err);
    }
  }

  // --- Students ---
  getStudent(email: string): StudentRecord | undefined {
    const norm = email.trim().toLowerCase();
    let student = this.data.students[norm];
    if (!student) {
      // If student is not explicitly seeded, check if it's a valid college roll number format
      // e.g. 24h71a1286@mictech.edu.in
      const atIdx = norm.indexOf("@");
      if (atIdx > 0) {
        const username = norm.substring(0, atIdx);
        // Check if username looks like a registration number (e.g. 24H71A1286)
        const isRollNo = /^[0-9]{2}[a-z0-9]{8}$/i.test(username);
        const namePart = isRollNo
          ? "MIC Student (" + username.toUpperCase() + ")"
          : username.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const regNo = isRollNo ? username.toUpperCase() : `MIC-${username.toUpperCase()}`;

        student = {
          id: this.data.counters.studentId++,
          email: norm,
          studentName: namePart,
          registerNumber: regNo,
          branch: "Information Technology",
          year: "3",
          semester: "5",
          mobileNumber: "9876543210",
          createdAt: new Date().toISOString(),
        };
        this.data.students[norm] = student;
        this.saveData();
      }
    }
    return student;
  }

  saveStudent(student: StudentRecord): StudentRecord {
    this.data.students[student.email.trim().toLowerCase()] = student;
    this.saveData();
    return student;
  }

  // --- Requests ---
  getRequests(): RequestRecord[] {
    return [...this.data.requests];
  }

  findRequestById(id: number): RequestRecord | undefined {
    return this.data.requests.find((r) => r.id === id);
  }

  findRequestByNumber(requestNumber: string): RequestRecord | undefined {
    return this.data.requests.find(
      (r) => r.requestNumber.trim().toUpperCase() === requestNumber.trim().toUpperCase()
    );
  }

  findRequestsByEmail(email: string): RequestRecord[] {
    const norm = email.trim().toLowerCase();
    return this.data.requests.filter((r) => r.email.trim().toLowerCase() === norm);
  }

  createRequest(data: Omit<RequestRecord, "id">): RequestRecord {
    const record: RequestRecord = {
      ...data,
      id: this.data.counters.requestId++,
    };
    this.data.requests.push(record);
    this.saveData();
    return record;
  }

  updateRequest(id: number, updates: Partial<RequestRecord>): RequestRecord | undefined {
    const idx = this.data.requests.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const updated = {
      ...this.data.requests[idx]!,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.requests[idx] = updated;
    this.saveData();
    return updated;
  }

  // --- Audit Logs ---
  getAuditLogs(requestNumber: string): AuditLogRecord[] {
    const norm = requestNumber.trim().toUpperCase();
    return this.data.auditLogs
      .filter((l) => l.requestNumber.trim().toUpperCase() === norm)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addAuditLog(data: Omit<AuditLogRecord, "id">): AuditLogRecord {
    const record: AuditLogRecord = {
      ...data,
      id: this.data.counters.auditId++,
    };
    this.data.auditLogs.push(record);
    this.saveData();
    return record;
  }

  // --- Notifications ---
  getNotifications(email: string): NotificationRecord[] {
    const norm = email.trim().toLowerCase();
    return this.data.notifications
      .filter((n) => n.email.trim().toLowerCase() === norm)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addNotification(data: Omit<NotificationRecord, "id">): NotificationRecord {
    const record: NotificationRecord = {
      ...data,
      id: this.data.counters.notifId++,
    };
    this.data.notifications.push(record);
    this.saveData();
    return record;
  }

  markNotificationRead(id: number): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveData();
      return true;
    }
    return false;
  }

  // --- OTPs ---
  getLatestOtp(email: string): OtpRecord | undefined {
    const norm = email.trim().toLowerCase();
    const records = this.data.otps
      .filter((o) => o.email.trim().toLowerCase() === norm)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return records[0];
  }

  saveOtp(email: string, hashedOtp: string, expiresAt: Date): OtpRecord {
    const norm = email.trim().toLowerCase();
    // Invalidate previous unused OTPs
    for (const o of this.data.otps) {
      if (o.email.trim().toLowerCase() === norm && !o.used) {
        o.used = true;
      }
    }

    const record: OtpRecord = {
      id: this.data.counters.otpId++,
      email: norm,
      otp: hashedOtp,
      used: false,
      attempts: 0,
      lockedUntil: null,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.data.otps.push(record);
    this.saveData();
    return record;
  }

  updateOtp(id: number, updates: Partial<OtpRecord>): void {
    const record = this.data.otps.find((o) => o.id === id);
    if (record) {
      Object.assign(record, updates);
      this.saveData();
    }
  }

  // --- Staff Users ---
  getStaffUsers(): StaffUserRecord[] {
    return Object.values(this.data.staffUsers || {});
  }

  getStaffUserById(id: number): StaffUserRecord | undefined {
    return Object.values(this.data.staffUsers || {}).find((u) => u.id === id);
  }

  getStaffUserByIdentifier(identifier: string): StaffUserRecord | undefined {
    const norm = identifier.trim().toLowerCase();
    return Object.values(this.data.staffUsers || {}).find(
      (u) => (u.username && u.username.toLowerCase() === norm) || (u.email && u.email.toLowerCase() === norm)
    );
  }

  saveStaffUser(user: Omit<StaffUserRecord, "id">): StaffUserRecord {
    if (!this.data.staffUsers) this.data.staffUsers = {};
    const id = this.data.counters.staffId || 20;
    this.data.counters.staffId = id + 1;
    const record: StaffUserRecord = {
      ...user,
      id,
    };
    this.data.staffUsers[record.username || record.email] = record;
    this.saveData();
    return record;
  }

  updateStaffUser(id: number, updates: Partial<StaffUserRecord>): StaffUserRecord | undefined {
    if (!this.data.staffUsers) return undefined;
    const existing = Object.values(this.data.staffUsers).find((u) => u.id === id);
    if (!existing) return undefined;
    Object.assign(existing, updates);
    this.saveData();
    return existing;
  }

  deleteStaffUser(id: number): boolean {
    if (!this.data.staffUsers) return false;
    for (const [key, val] of Object.entries(this.data.staffUsers)) {
      if (val.id === id) {
        delete this.data.staffUsers[key];
        this.saveData();
        return true;
      }
    }
    return false;
  }
}

export const portalStorage = new PortalStorage();
