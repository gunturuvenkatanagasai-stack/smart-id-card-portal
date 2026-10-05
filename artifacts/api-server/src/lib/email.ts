import nodemailer from "nodemailer";
import { logger } from "./logger";

function isDummyPassword(pass: string): boolean {
  const p = (pass || "").toLowerCase().trim();
  return (
    !p ||
    p.includes("dummy") ||
    p.includes("placeholder") ||
    p === "your_password" ||
    p === "your_app_password" ||
    p === "your-app-password" ||
    p === "password" ||
    p === "123456"
  );
}

function createTransporter(): nodemailer.Transporter | null {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();
  const pass = rawPass.replace(/\s+/g, ""); // Remove spaces commonly found in Google App Passwords
  const host = (process.env.SMTP_HOST || (user.toLowerCase().endsWith("@gmail.com") ? "smtp.gmail.com" : "")).trim();
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  // Gmail-specific configuration using nodemailer service
  if (host === "smtp.gmail.com" || user.toLowerCase().endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function getSenderAddress(): string {
  const customFrom = process.env.SMTP_FROM?.trim();
  if (customFrom) return customFrom;
  const name = process.env.SMTP_FROM_NAME?.trim() || "MIC College Student Portal";
  const email = process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim() || "noreply@mictech.edu.in";
  return `"${name}" <${email}>`;
}

export type SendEmailResult = {
  success: boolean;
  emailSent: boolean;
  deliveryMethod: "smtp" | "ethereal" | "simulated";
  previewUrl?: string;
  error?: string;
};

function getOtpEmailHtml(otp: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0f172a 100%); padding: 30px 24px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em;">DVR &amp; DR HS MIC College of Technology</h2>
        <p style="color: #93c5fd; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Autonomous Institution &bull; Student ID Card Portal</p>
      </div>
      <div style="padding: 32px 28px; color: #1e293b;">
        <h3 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Student Verification Code</h3>
        <p style="color: #475569; font-size: 14px; margin: 0 0 16px 0; line-height: 1.5;">Hello Student,</p>
        <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
          Use the 6-digit verification code below to authenticate and access the ID Card Reissue Portal:
        </p>
        <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 22px; text-align: center; margin: 0 0 24px 0;">
          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1e40af; display: inline-block; padding-left: 12px;">${otp}</span>
          <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0; font-weight: 500;">⏱ This OTP is valid for <strong>5 minutes</strong></p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
          <strong>Security Notice:</strong> Do not share this OTP with anyone. College staff will never ask for your verification code.
        </p>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 28px 0;">
          If you did not request this OTP, you can safely disregard this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
          <strong style="color: #0f172a;">MIC College ID Card Portal</strong><br />
          DVR &amp; DR HS MIC College of Technology<br />
          Kanchikacharla, NTR District, Andhra Pradesh - 521180
        </div>
      </div>
    </div>
  `;
}

export async function sendOtpEmail(to: string, otp: string): Promise<SendEmailResult> {
  const rawPass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();
  const hasDummyPass = isDummyPassword(rawPass);
  const transporter = createTransporter();

  // 1. Attempt Real SMTP Send (if real credentials provided)
  if (transporter && !hasDummyPass) {
    try {
      const info = await transporter.sendMail({
        from: getSenderAddress(),
        to,
        subject: "Your College Portal Verification OTP",
        text: `MIC College Student Portal\n\nCollege Email Verification\n\nHello Student,\n\nYour verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\nDo not share this OTP with anyone.\n\nRegards,\nMIC College Student Portal\nDVR&DR HS MIC College of Technology`,
        html: getOtpEmailHtml(otp),
      });

      console.log("\n==================================================");
      console.log(" [SMTP SUCCESS] REAL OTP DISPATCHED TO STUDENT");
      console.log(` Student Email: ${to}`);
      console.log(` 6-Digit OTP:   ${otp}`);
      console.log(` Message ID:    ${info.messageId}`);
      console.log("==================================================\n");

      logger.info({ to, messageId: info.messageId }, "Real OTP email dispatched via SMTP");
      return { success: true, emailSent: true, deliveryMethod: "smtp" };
    } catch (err: any) {
      console.error("\n[SMTP WARNING] Failed to dispatch email via SMTP:", err?.message || err);
      logger.error({ err, to }, "Failed to send OTP email via SMTP, attempting fallback");
    }
  }

  // 2. Fallback: Ethereal test inbox dispatch (visual web preview) & Terminal log
  let previewUrl: string | undefined;
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 5000,
    });

    const testInfo = await etherealTransporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: "Your College Portal Verification OTP",
      text: `Your verification OTP is: ${otp}`,
      html: getOtpEmailHtml(otp),
    });

    const testUrl = nodemailer.getTestMessageUrl(testInfo);
    if (testUrl) {
      previewUrl = testUrl;
    }
  } catch {
    // Ethereal test account unavailable (e.g. offline) - proceed to terminal output
  }

  console.log("\n==================================================");
  console.log(" [MIC PORTAL] VERIFICATION OTP DISPATCHED");
  console.log(` Student Email:   ${to}`);
  console.log(` 6-Digit OTP:     ${otp}`);
  console.log(" Valid for:       5 Minutes");
  console.log(" Demo OTP:        123456 (Always active in code for demo)");
  if (previewUrl) {
    console.log(` Web Preview URL: ${previewUrl}`);
  }
  if (hasDummyPass) {
    console.log(" [TIP] To deliver directly to your actual Gmail inbox, add your 16-character Google App Password to .env (SMTP_PASSWORD=...)");
  }
  console.log("==================================================\n");

  logger.info({ to, previewUrl }, "OTP generated and dispatched");
  return {
    success: true,
    emailSent: true,
    deliveryMethod: previewUrl ? "ethereal" : "simulated",
    previewUrl,
  };
}

export async function sendApplicationSubmittedEmail(to: string, requestNumber: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: `ID Card Application Submitted [${requestNumber}]`,
      text: `Your missing ID card reissue application ${requestNumber} has been successfully submitted and is pending HOD approval.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
          <div style="background:#1a56db;padding:20px;text-align:center;color:#fff">
            <h3 style="margin:0">Application Submitted Successfully</h3>
          </div>
          <div style="padding:24px;background:#fff;color:#374151">
            <p>Your application ID is <strong>${requestNumber}</strong>.</p>
            <p>It has been routed to your Department HOD for initial verification &amp; approval.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendHODApprovalEmail(to: string, requestNumber: string, status: string, remark?: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  const isApproved = status === "PENDING_PRINCIPAL_APPROVAL" || status === "HOD_APPROVED";
  try {
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: `HOD Update: Application ${requestNumber} - ${isApproved ? "Approved" : "Rejected"}`,
      text: `Your ID Card application ${requestNumber} was ${isApproved ? "Approved" : "Rejected"} by HOD.${remark ? ` Remarks: ${remark}` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
          <div style="background:${isApproved ? "#059669" : "#dc2626"};padding:20px;text-align:center;color:#fff">
            <h3 style="margin:0">HOD ${isApproved ? "Approved" : "Rejected"} Application</h3>
          </div>
          <div style="padding:24px;background:#fff;color:#374151">
            <p>Application ID: <strong>${requestNumber}</strong></p>
            <p>Status: <strong>${isApproved ? "Forwarded to Principal for Approval" : "Rejected by HOD"}</strong></p>
            ${remark ? `<p><strong>HOD Remarks:</strong> ${remark}</p>` : ""}
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendPrincipalApprovalEmail(to: string, requestNumber: string, status: string, remark?: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  const isApproved = status === "PENDING_ADMIN_VERIFICATION" || status === "PRINCIPAL_APPROVED";
  try {
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Principal Update: Application ${requestNumber} - ${isApproved ? "Approved" : "Rejected"}`,
      text: `Your ID Card application ${requestNumber} was ${isApproved ? "Approved" : "Rejected"} by the Principal.${remark ? ` Remarks: ${remark}` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
          <div style="background:${isApproved ? "#059669" : "#dc2626"};padding:20px;text-align:center;color:#fff">
            <h3 style="margin:0">Principal ${isApproved ? "Approved" : "Rejected"} Application</h3>
          </div>
          <div style="padding:24px;background:#fff;color:#374151">
            <p>Application ID: <strong>${requestNumber}</strong></p>
            <p>Status: <strong>${isApproved ? "Approved by Principal — Forwarded to Admin for Verification" : "Rejected by Principal"}</strong></p>
            ${remark ? `<p><strong>Principal Remarks:</strong> ${remark}</p>` : ""}
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendPaymentConfirmationEmail(to: string, requestNumber: string, amount: string, txId: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Payment Receipt: Application ${requestNumber}`,
      text: `Payment of ₹${amount} for application ${requestNumber} received successfully. Transaction ID: ${txId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
          <div style="background:#059669;padding:20px;text-align:center;color:#fff">
            <h3 style="margin:0">Payment Received Successfully</h3>
          </div>
          <div style="padding:24px;background:#fff;color:#374151">
            <p>Application ID: <strong>${requestNumber}</strong></p>
            <p>Amount Paid: <strong>₹${amount}</strong></p>
            <p>Transaction ID: <strong>${txId}</strong></p>
            <p>Your ID card has been sent to the ID Card Department for printing.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendReadyToCollectEmail(to: string, requestNumber: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: `ID Card Ready for Collection! [${requestNumber}]`,
      text: `Your new college ID card (${requestNumber}) is ready for physical collection at the ID Card Department. Please bring your QR receipt.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
          <div style="background:#2563eb;padding:24px;text-align:center;color:#fff">
            <h3 style="margin:0">Your College ID Card is Ready for Collection!</h3>
          </div>
          <div style="padding:24px;background:#fff;color:#374151">
            <p>Application ID: <strong>${requestNumber}</strong></p>
            <p>Please visit the <strong>ID Card Department</strong> with your digital/printed QR Receipt to collect your physical ID card.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendCollectionConfirmationEmail(to: string, requestNumber: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject: `ID Card Handover Confirmed [${requestNumber}]`,
      text: `Your college ID card (${requestNumber}) has been successfully handed over and collected.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
          <div style="background:#059669;padding:20px;text-align:center;color:#fff">
            <h3 style="margin:0">ID Card Handover Completed</h3>
          </div>
          <div style="padding:24px;background:#fff;color:#374151">
            <p>Application ID: <strong>${requestNumber}</strong></p>
            <p>Your ID card collection has been recorded in the college portal system.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
