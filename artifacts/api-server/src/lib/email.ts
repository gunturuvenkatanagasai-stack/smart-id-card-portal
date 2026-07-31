import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Gmail not configured — OTP not emailed");
    return false;
  }
  await transporter.sendMail({
    from: `"MIC College ID Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your OTP for ID Card Reissue Portal",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#1a56db;padding:24px;text-align:center">
          <img src="https://www.mictech.edu.in/images/logo-small.png" alt="MIC College" width="48" style="border-radius:50%;background:#fff;padding:4px"/>
          <h2 style="color:#fff;margin:12px 0 4px">DVR &amp; DR HS MIC College of Technology</h2>
          <p style="color:#bfdbfe;font-size:13px;margin:0">ID Card Reissue Portal</p>
        </div>
        <div style="padding:32px 24px">
          <p style="color:#374151;font-size:15px">Hello,</p>
          <p style="color:#374151;font-size:15px">Use the OTP below to verify your email address. It is valid for <strong>10 minutes</strong>.</p>
          <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1a56db">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:13px">If you did not request this OTP, please ignore this email.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">DVR &amp; DR HS MIC College of Technology, Kanchikacharla, Krishna District, AP</p>
          <p style="color:#9ca3af;font-size:12px;margin:4px 0 0"><a href="https://www.mictech.edu.in" style="color:#1a56db">www.mictech.edu.in</a></p>
        </div>
      </div>
    `,
  });
  logger.info({ to }, "OTP email sent via Gmail");
  return true;
}
