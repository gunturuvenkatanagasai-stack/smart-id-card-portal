import { Router, type IRouter } from "express";
import { db, otpsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { SendOtpBody, VerifyOtpBody } from "@workspace/api-zod";
import crypto from "crypto";
import { sendOtpEmail } from "../lib/email";

const router: IRouter = Router();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(email: string): string {
  return crypto.createHash("sha256").update(`${email}-${Date.now()}-${Math.random()}`).digest("hex");
}

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(otpsTable).values({ email, otp, used: false, expiresAt });

  const emailSent = await sendOtpEmail(email, otp);
  req.log.info({ email, emailSent }, "OTP generated");

  const isDev = process.env.NODE_ENV === "development";
  res.json({
    message: emailSent
      ? `OTP sent to ${email}. Check your inbox.`
      : `OTP sent to ${email}. Check your inbox.`,
    // Only expose OTP in dev mode when email is not configured
    ...(isDev && !emailSent ? { otp } : {}),
  });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, otp } = parsed.data;

  const [record] = await db
    .select()
    .from(otpsTable)
    .where(
      and(
        eq(otpsTable.email, email),
        eq(otpsTable.otp, otp),
        eq(otpsTable.used, false),
        gt(otpsTable.expiresAt, new Date())
      )
    )
    .orderBy(otpsTable.createdAt)
    .limit(1);

  if (!record) {
    res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
    return;
  }

  await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, record.id));

  const token = generateToken(email);

  req.log.info({ email }, "OTP verified");

  res.json({
    token,
    email,
    message: "Email verified successfully.",
  });
});

export default router;
