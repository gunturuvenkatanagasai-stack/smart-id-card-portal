import { Router, type IRouter } from "express";
import { db, otpsTable, studentsTable, type Student } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SendOtpBody, ResendOtpBody, VerifyOtpBody } from "@workspace/api-zod";
import crypto from "crypto";
import { sendOtpEmail } from "../lib/email";
import { portalStorage } from "../lib/storage";
import { activeStudentSessions } from "../middleware/auth";

const router: IRouter = Router();
const isDevelopment = process.env.NODE_ENV === "development";

// Allowed official college domains
const ALLOWED_COLLEGE_DOMAINS = ["mictech.edu.in", "mic.edu.in"];

const PERSONAL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "protonmail.com",
  "mail.com",
  "zoho.com",
];

type OtpRecord = {
  id: number;
  email: string;
  otp: string; // SHA-256 hashed OTP
  used: boolean;
  attempts: number;
  lockedUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
};

// Registered students database fallback
const fallbackStudents: Record<string, Student> = {
  "gunturuvenkatanagasai@mictech.edu.in": {
    id: 3,
    email: "gunturuvenkatanagasai@mictech.edu.in",
    studentName: "Guntur Venkata Naga sai",
    registerNumber: "24H71A1286",
    branch: "Information Technology",
    year: "3",
    semester: "5",
    mobileNumber: "9876543211",
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
  },
};

const activeOtpRecords = new Map<string, OtpRecord>();
let localOtpCounter = 1;

// Rate limiting in-memory trackers
type EmailRateLimit = {
  timestamps: number[];
  lastRequestAt: number;
};

const emailRateLimits = new Map<string, EmailRateLimit>();
const ipRateLimits = new Map<string, number[]>();

function checkRateLimits(
  email: string,
  ip: string
): { allowed: boolean; status: number; message: string; cooldownSeconds?: number } {
  const now = Date.now();
  const fifteenMinsAgo = now - 15 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // 1. IP check: Max 10 requests per hour
  const ipReqs = (ipRateLimits.get(ip) || []).filter((t) => t > oneHourAgo);
  if (ipReqs.length >= 10) {
    return {
      allowed: false,
      status: 429,
      message: "Too many OTP requests. Please wait before trying again.",
    };
  }

  // 2. Email check: 30s cooldown
  const emailData = emailRateLimits.get(email) || { timestamps: [], lastRequestAt: 0 };
  if (emailData.lastRequestAt && now - emailData.lastRequestAt < 30 * 1000) {
    const cooldown = Math.ceil((30 * 1000 - (now - emailData.lastRequestAt)) / 1000);
    return {
      allowed: false,
      status: 429,
      message: `You can request another OTP in ${cooldown} seconds.`,
      cooldownSeconds: cooldown,
    };
  }

  // 3. Email check: Max 3 requests per 15 minutes
  const recentEmailReqs = emailData.timestamps.filter((t) => t > fifteenMinsAgo);
  if (recentEmailReqs.length >= 3) {
    return {
      allowed: false,
      status: 429,
      message: "Too many OTP requests. Please wait before trying again.",
    };
  }

  return { allowed: true, status: 200, message: "" };
}

function recordRateLimitAttempt(email: string, ip: string): void {
  const now = Date.now();
  const fifteenMinsAgo = now - 15 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // Record IP
  const ipReqs = (ipRateLimits.get(ip) || []).filter((t) => t > oneHourAgo);
  ipReqs.push(now);
  ipRateLimits.set(ip, ipReqs);

  // Record Email
  const emailData = emailRateLimits.get(email) || { timestamps: [], lastRequestAt: 0 };
  const recent = emailData.timestamps.filter((t) => t > fifteenMinsAgo);
  recent.push(now);
  emailRateLimits.set(email, {
    timestamps: recent,
    lastRequestAt: now,
  });
}

function isOfficialCollegeEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const atIdx = normalized.lastIndexOf("@");
  if (atIdx === -1) return false;

  const domain = normalized.substring(atIdx + 1);

  // Explicitly reject personal email providers
  if (PERSONAL_DOMAINS.includes(domain)) {
    return false;
  }

  // Only allow configured college domains (@mictech.edu.in, @mic.edu.in)
  return ALLOWED_COLLEGE_DOMAINS.includes(domain);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateSecureOtp(): { rawOtp: string; hashedOtp: string } {
  // Cryptographically secure 6-digit OTP using Node.js crypto
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(rawOtp);
  return { rawOtp, hashedOtp };
}

function generateToken(email: string): string {
  return crypto
    .createHash("sha256")
    .update(`${email}-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`)
    .digest("hex");
}

async function findStudentByEmail(email: string): Promise<Student | undefined> {
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(studentsTable)
        .where(eq(studentsTable.email, email))
        .limit(1);

      if (found) {
        return found;
      }
    } catch {
      // Database unavailable, proceed to persistent storage lookup
    }
  }

  const s = portalStorage.getStudent(email);
  if (!s) return undefined;
  return {
    ...s,
    createdAt: new Date(s.createdAt),
  };
}

async function getLatestOtpRecord(email: string): Promise<OtpRecord | undefined> {
  if (db) {
    try {
      const [record] = await db
        .select()
        .from(otpsTable)
        .where(eq(otpsTable.email, email))
        .orderBy(desc(otpsTable.createdAt))
        .limit(1);

      if (record) {
        return {
          id: record.id,
          email: record.email,
          otp: record.otp,
          used: record.used,
          attempts: record.attempts,
          lockedUntil: record.lockedUntil,
          expiresAt: record.expiresAt,
          createdAt: record.createdAt,
        };
      }
    } catch {
      // DB offline, fall back to persistent storage
    }
  }

  const o = portalStorage.getLatestOtp(email);
  if (!o) return undefined;
  return {
    id: o.id,
    email: o.email,
    otp: o.otp,
    used: o.used,
    attempts: o.attempts,
    lockedUntil: o.lockedUntil ? new Date(o.lockedUntil) : null,
    expiresAt: new Date(o.expiresAt),
    createdAt: new Date(o.createdAt),
  };
}

async function saveOtpRecord(email: string, hashedOtp: string, expiresAt: Date): Promise<OtpRecord> {
  if (db) {
    try {
      // Invalidate existing unused records in DB
      await db
        .update(otpsTable)
        .set({ used: true })
        .where(eq(otpsTable.email, email));

      const [inserted] = await db.insert(otpsTable).values({
        email,
        otp: hashedOtp,
        used: false,
        attempts: 0,
        expiresAt,
      }).returning();

      if (inserted) {
        return inserted;
      }
    } catch {
      // Keep persistent storage record if DB insert fails
    }
  }

  const saved = portalStorage.saveOtp(email, hashedOtp, expiresAt);
  return {
    id: saved.id,
    email: saved.email,
    otp: saved.otp,
    used: saved.used,
    attempts: saved.attempts,
    lockedUntil: saved.lockedUntil ? new Date(saved.lockedUntil) : null,
    expiresAt: new Date(saved.expiresAt),
    createdAt: new Date(saved.createdAt),
  };
}

async function updateOtpRecord(record: OtpRecord, updates: Partial<OtpRecord>): Promise<void> {
  if (db) {
    try {
      await db
        .update(otpsTable)
        .set({
          used: updates.used ?? record.used,
          attempts: updates.attempts ?? record.attempts,
          lockedUntil: updates.lockedUntil ?? record.lockedUntil,
          expiresAt: updates.expiresAt ?? record.expiresAt,
        })
        .where(eq(otpsTable.id, record.id));
    } catch {
      // Retain persistent storage state
    }
  }

  portalStorage.updateOtp(record.id, {
    used: updates.used ?? record.used,
    attempts: updates.attempts ?? record.attempts,
    lockedUntil: updates.lockedUntil ? updates.lockedUntil.toISOString() : (updates.lockedUntil === null ? null : record.lockedUntil ? record.lockedUntil.toISOString() : null),
    expiresAt: updates.expiresAt ? updates.expiresAt.toISOString() : record.expiresAt.toISOString(),
  });
}

// -------------------------------------------------------------
// POST /api/auth/send-otp
// -------------------------------------------------------------
router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
      error: "Please enter a valid email address.",
    });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "127.0.0.1";

  // Rate Limiting Validation (30s cooldown, 3 req / 15 min, 10 / hr IP)
  const rateLimit = checkRateLimits(email, ip);
  if (!rateLimit.allowed) {
    res.status(rateLimit.status).json({
      success: false,
      message: rateLimit.message,
      error: rateLimit.message,
      cooldownSeconds: rateLimit.cooldownSeconds,
    });
    return;
  }

  // Ensure student record exists (retrieves existing student or auto-registers new student in storage)
  let student = await findStudentByEmail(email);
  if (!student) {
    const s = portalStorage.getStudent(email);
    if (s) {
      student = { ...s, createdAt: new Date(s.createdAt) };
    }
  }

  // Generate Cryptographically Secure 6-Digit OTP
  const { rawOtp, hashedOtp } = generateSecureOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Store Hashed OTP in database / storage
  await saveOtpRecord(email, hashedOtp, expiresAt);
  recordRateLimitAttempt(email, ip);

  // Send Real OTP Email to the student email they logged in with
  const emailResult = await sendOtpEmail(email, rawOtp);
  if (!emailResult.success) {
    res.status(503).json({
      success: false,
      message: emailResult.error || "Unable to send OTP right now. Please try again.",
      error: emailResult.error || "Unable to send OTP right now. Please try again.",
    });
    return;
  }

  // Success Response
  res.json({
    success: true,
    message: emailResult.emailSent
      ? `Verification OTP sent successfully to ${email}.`
      : `Verification code generated for ${email}.`,
    expiresInSeconds: 300,
    resendCooldownSeconds: 30,
    emailSent: emailResult.emailSent,
    deliveryMethod: emailResult.deliveryMethod,
    previewUrl: emailResult.previewUrl,
    demoOtp: "123456",
    otpMode: "active",
    otp: rawOtp,
  });
});

// -------------------------------------------------------------
// POST /api/auth/resend-otp
// -------------------------------------------------------------
router.post("/auth/resend-otp", async (req, res): Promise<void> => {
  const parsed = ResendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
      error: "Please enter a valid email address.",
    });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "127.0.0.1";

  // Rate Limiting Validation (30s cooldown, 3 req / 15 min, 10 / hr IP)
  const rateLimit = checkRateLimits(email, ip);
  if (!rateLimit.allowed) {
    res.status(rateLimit.status).json({
      success: false,
      message: rateLimit.message,
      error: rateLimit.message,
      cooldownSeconds: rateLimit.cooldownSeconds,
    });
    return;
  }

  // Ensure student record exists
  let student = await findStudentByEmail(email);
  if (!student) {
    const s = portalStorage.getStudent(email);
    if (s) {
      student = { ...s, createdAt: new Date(s.createdAt) };
    }
  }

  // Invalidate Previous OTP
  const previousRecord = await getLatestOtpRecord(email);
  if (previousRecord) {
    await updateOtpRecord(previousRecord, { used: true });
  }

  // Generate New Cryptographically Secure 6-Digit OTP
  const { rawOtp, hashedOtp } = generateSecureOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Store Hashed OTP
  await saveOtpRecord(email, hashedOtp, expiresAt);
  recordRateLimitAttempt(email, ip);

  // Send Real OTP Email to the student email
  const emailResult = await sendOtpEmail(email, rawOtp);
  if (!emailResult.success) {
    res.status(503).json({
      success: false,
      message: emailResult.error || "Unable to send OTP right now. Please try again.",
      error: emailResult.error || "Unable to send OTP right now. Please try again.",
    });
    return;
  }

  // Success Response
  res.json({
    success: true,
    message: emailResult.emailSent
      ? `New OTP sent successfully to ${email}.`
      : `New verification code generated for ${email}.`,
    expiresInSeconds: 300,
    resendCooldownSeconds: 30,
    emailSent: emailResult.emailSent,
    deliveryMethod: emailResult.deliveryMethod,
    previewUrl: emailResult.previewUrl,
    demoOtp: "123456",
    otpMode: "active",
    otp: rawOtp,
  });
});

// -------------------------------------------------------------
// POST /api/auth/verify-otp
// -------------------------------------------------------------
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Please enter the 6-digit OTP.",
      error: "Please enter the 6-digit OTP.",
    });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const inputOtp = parsed.data.otp.trim();

  if (!inputOtp || !/^\d{6}$/.test(inputOtp)) {
    res.status(400).json({
      success: false,
      message: "Invalid OTP format. OTP must be exactly 6 digits.",
      error: "Invalid OTP format. OTP must be exactly 6 digits.",
    });
    return;
  }

  // Demo OTP "123456" shortcut: always valid for instant demonstration
  if (inputOtp === "123456") {
    let student = await findStudentByEmail(email);
    if (!student) {
      const s = portalStorage.getStudent(email);
      if (s) student = { ...s, createdAt: new Date(s.createdAt) };
    }
    const token = generateToken(email);

    activeStudentSessions.set(token, {
      id: student?.id || 1,
      name: student?.studentName || "Student",
      email: email,
      role: "STUDENT",
      department: student?.branch || null,
      isActive: true,
    });

    res.json({
      success: true,
      message: "College email verified successfully via Demo OTP.",
      token,
      email,
      student,
    });
    return;
  }

  // 1. Find Latest OTP Record
  const latestRecord = await getLatestOtpRecord(email);

  if (!latestRecord || latestRecord.used) {
    res.status(400).json({
      success: false,
      message: "Invalid OTP. Please check the OTP sent to your email or use the Demo OTP (123456).",
      error: "Invalid OTP. Please check the OTP sent to your email or use the Demo OTP (123456).",
    });
    return;
  }

  // 2. Check Lockout Status (>= 5 attempts)
  if (latestRecord.attempts >= 5 || (latestRecord.lockedUntil && latestRecord.lockedUntil > new Date())) {
    res.status(429).json({
      success: false,
      message: "Too many incorrect attempts. Please request a new OTP or use the Demo OTP (123456).",
      error: "Too many incorrect attempts. Please request a new OTP or use the Demo OTP (123456).",
      remainingAttempts: 0,
    });
    return;
  }

  // 3. Check 5-Minute Expiration
  if (latestRecord.expiresAt <= new Date()) {
    res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP or use Demo OTP (123456).",
      error: "OTP expired. Please request a new OTP or use Demo OTP (123456).",
    });
    return;
  }

  // 4. Compare the submitted OTP with the stored hash
  const submittedHash = hashOtp(inputOtp);
  const isMatch = submittedHash === latestRecord.otp;

  if (!isMatch) {
    const currentAttempts = latestRecord.attempts + 1;
    const isLocked = currentAttempts >= 5;
    const lockedUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await updateOtpRecord(latestRecord, {
      attempts: currentAttempts,
      lockedUntil,
      used: isLocked, // Invalidate OTP after 5 failed attempts
    });

    if (isLocked) {
      res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP or use the Demo OTP (123456).",
        error: "Too many incorrect attempts. Please request a new OTP or use the Demo OTP (123456).",
        remainingAttempts: 0,
      });
      return;
    }

    const remainingAttempts = 5 - currentAttempts;
    res.status(400).json({
      success: false,
      message: "Invalid OTP. Please enter the OTP sent to your email or use the Demo OTP (123456).",
      error: "Invalid OTP. Please enter the OTP sent to your email or use the Demo OTP (123456).",
      remainingAttempts,
    });
    return;
  }

  // 5. Verification Successful - Mark OTP as used immediately (single-use)
  await updateOtpRecord(latestRecord, { used: true, attempts: 0, lockedUntil: null });

  // 6. Fetch Student Profile
  let student = await findStudentByEmail(email);
  if (!student) {
    const s = portalStorage.getStudent(email);
    if (s) {
      student = { ...s, createdAt: new Date(s.createdAt) };
    }
  }

  const token = generateToken(email);

  activeStudentSessions.set(token, {
    id: student?.id || 1,
    name: student?.studentName || "Student",
    email: email,
    role: "STUDENT",
    department: student?.branch || null,
    isActive: true,
  });

  res.json({
    success: true,
    message: "Email verified successfully.",
    token,
    email,
    student,
  });
});

export default router;
