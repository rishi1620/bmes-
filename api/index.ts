import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const GMAIL_USER = (process.env.GMAIL_USER || "bmes@cuet.ac.bd").trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.trim();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  }
});
const FROM_EMAIL = GMAIL_USER;
const OFFICIAL_REPLY_TO = "bmes@cuet.ac.bd";
const APP_URL = process.env.APP_URL || "https://cuetbmes.vercel.app";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/send-otp", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: "Email service is not configured. Please set GMAIL_APP_PASSWORD." });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create stateless verification token
  const secret = GMAIL_APP_PASSWORD || "fallback-secret-key-123";
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
  const dataToHash = `${email}:${otp}:${expiresAt}`;
  const hash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");
  const verificationToken = `${expiresAt}.${hash}`;

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      replyTo: OFFICIAL_REPLY_TO,
      to: email,
      subject: "Your Event Registration Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #00568a;">Verification Code</h1>
          <p>Hi,</p>
          <p>Your verification code for event registration is: <strong style="font-size: 24px;">${otp}</strong></p>
          <p>Please enter this code in the registration form to complete your registration. This code will expire in 10 minutes.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>CUET BIOMEDICAL ENGINEERING SOCIETY</strong></p>
        </div>
      `,
    });
    res.json({ success: true, verificationToken });
  } catch (err) {
    console.error("Failed to send OTP:", err);
    res.status(500).json({ error: "Failed to send verification code." });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp, verificationToken } = req.body;
  if (!email || !otp || !verificationToken) {
    return res.status(400).json({ error: "Missing email, otp, or verification token" });
  }

  const parts = verificationToken.split(".");
  if (parts.length !== 2) {
    return res.status(400).json({ error: "Invalid verification token format" });
  }

  const [expiresAtStr, hash] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  
  if (Date.now() > expiresAt) {
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }

  const secret = process.env.GMAIL_APP_PASSWORD || "fallback-secret-key-123";
  const dataToHash = `${email}:${otp}:${expiresAt}`;
  const expectedHash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");

  if (hash !== expectedHash) {
    return res.status(400).json({ error: "Invalid verification code" });
  }

  // OTP is valid
  res.json({ success: true });
});

// Member Registration Official Email Verification (Dispatched from bmes@cuet.ac.bd)
app.post("/api/send-member-verification-otp", async (req, res) => {
  const { email, name, studentId } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "A valid university email address is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Validate university domain
  const isCuetDomain = normalizedEmail.endsWith("@student.cuet.ac.bd") || normalizedEmail.endsWith("@cuet.ac.bd");
  if (!isCuetDomain) {
    return res.status(400).json({
      error: "Please provide your official CUET student email address (@student.cuet.ac.bd or @cuet.ac.bd)."
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const secret = process.env.GMAIL_APP_PASSWORD || "cuet-bmes-member-verification-secret";
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
  const dataToHash = `member:${normalizedEmail}:${otp}:${expiresAt}`;
  const hash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");
  const verificationToken = `${expiresAt}.${hash}`;

  const studentName = name?.trim() || "Prospective BMES Member";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Header Banner -->
      <div style="background-color: #00568a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #bae6fd;">
          Chittagong University of Engineering & Technology
        </p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
          BIOMEDICAL ENGINEERING SOCIETY (BMES)
        </h1>
        <p style="margin: 8px 0 0 0; font-size: 12px; font-weight: 600; color: #fef08a;">
          Official Member Authenticity & Email Verification Desk
        </p>
      </div>

      <!-- Main Body -->
      <div style="padding: 32px 28px; color: #1e293b;">
        <div style="display: inline-block; padding: 4px 10px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; font-size: 11px; font-weight: 700; color: #00568a; text-transform: uppercase; margin-bottom: 16px;">
          Official Dispatch: bmes@cuet.ac.bd
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
          Verify Your University Email for Portal Membership
        </h2>

        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
          Dear <strong>${studentName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
          You have initiated a new member registration on the official <strong>CUET BMES Portal</strong>. To confirm your status as a registered university student and ensure member authenticity in our official records, please enter the one-time verification passcode below:
        </p>

        <!-- Code Box -->
        <div style="margin: 24px 0; padding: 24px; background-color: #f8fafc; border: 2px dashed #00568a; border-radius: 10px; text-align: center;">
          <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">
            One-Time Passcode (OTP)
          </span>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #00568a;">
            ${otp}
          </div>
          <span style="display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 600; color: #b45309; background-color: #fef3c7; padding: 3px 8px; border-radius: 4px;">
            Expires in 10 minutes
          </span>
        </div>

        <!-- Verification Metadata -->
        <div style="margin-bottom: 24px; padding: 16px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #475569; line-height: 1.6;">
          <div style="margin-bottom: 4px;"><strong>Target Student Email:</strong> ${normalizedEmail}</div>
          ${studentId ? `<div style="margin-bottom: 4px;"><strong>Student ID:</strong> ${studentId}</div>` : ''}
          <div><strong>Authorized Dispatch Address:</strong> bmes@cuet.ac.bd (Official Society Desk)</div>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
          <strong>Security Assurance:</strong> This verification code was sent from <strong>bmes@cuet.ac.bd</strong>. Society administrators will never ask for your password or credentials. If you did not request this verification, please contact us immediately at <a href="mailto:bmes@cuet.ac.bd" style="color: #00568a; text-decoration: underline;">bmes@cuet.ac.bd</a>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">
          Biomedical Engineering Society (BMES), CUET
        </p>
        <p style="margin: 0; color: #94a3b8;">
          Department of Biomedical Engineering • Chittagong University of Engineering & Technology, Raozan, Chattogram-4349
        </p>
      </div>
    </div>
  `;

  try {
    if (GMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: `CUET BMES <${FROM_EMAIL}>`,
        replyTo: OFFICIAL_REPLY_TO,
        to: normalizedEmail,
        subject: `[CUET BMES] Official Email Verification Code: ${otp}`,
        html: emailHtml,
      });
      console.log(`[Email Verification] Successfully dispatched OTP (${otp}) from ${FROM_EMAIL} to ${normalizedEmail}`);
    } else {
      console.warn(`[Email Verification] GMAIL_APP_PASSWORD not configured. Simulated dispatch to ${normalizedEmail} with OTP: ${otp}`);
    }

    return res.json({
      success: true,
      sender: FROM_EMAIL,
      verificationToken,
      expiresAt,
      message: `Verification code dispatched from ${FROM_EMAIL} to ${normalizedEmail}.`
    });
  } catch (err: unknown) {
    console.error("[Email Verification] Transporter error:", err);
    // Return structured error
    return res.status(500).json({
      error: "Failed to dispatch verification email from bmes@cuet.ac.bd. Please check server logs or try again shortly."
    });
  }
});

app.post("/api/verify-member-otp", (req, res) => {
  const { email, otp, verificationToken } = req.body;
  if (!email || !otp || !verificationToken) {
    return res.status(400).json({ error: "Missing email, verification code, or token." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.toString().trim();

  const parts = verificationToken.split(".");
  if (parts.length !== 2) {
    return res.status(400).json({ error: "Invalid verification token format." });
  }

  const [expiresAtStr, hash] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (Date.now() > expiresAt) {
    return res.status(400).json({ error: "The verification code has expired. Please request a new code." });
  }

  const secret = process.env.GMAIL_APP_PASSWORD || "cuet-bmes-member-verification-secret";
  const dataToHash = `member:${normalizedEmail}:${cleanOtp}:${expiresAt}`;
  const expectedHash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");

  if (hash !== expectedHash) {
    return res.status(400).json({ error: "Incorrect verification code. Please check your email and try again." });
  }

  res.json({
    success: true,
    verifiedEmail: normalizedEmail,
    verifiedBy: "bmes@cuet.ac.bd",
    verifiedAt: new Date().toISOString()
  });
});

app.post("/api/send-confirmation", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    console.error("GMAIL_APP_PASSWORD is not set");
    return res.status(500).json({ error: "Email service is not configured on the server." });
  }

  const { email, name, eventTitle } = req.body;

  if (!email || !name || !eventTitle) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      replyTo: OFFICIAL_REPLY_TO,
      to: email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #00568a; font-size: 24px; margin-top: 0;">Registration Confirmed!</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">Hi ${name},</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">You have successfully registered for <strong>${eventTitle}</strong>.</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">We look forward to seeing you there!</p>
          <br/>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">Best regards,</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;"><strong>CUET BIOMEDICAL ENGINEERING SOCIETY</strong></p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Detailed Nodemailer error in /api/send-confirmation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-membership-confirmation", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    console.error("GMAIL_APP_PASSWORD is not set");
    return res.status(500).json({ error: "Email service is not configured on the server." });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      replyTo: OFFICIAL_REPLY_TO,
      to: email,
      subject: "[CUET BMES] Membership Application Received & Verified",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #00568a; padding: 26px 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #bae6fd;">
              Chittagong University of Engineering & Technology
            </p>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
              BIOMEDICAL ENGINEERING SOCIETY (BMES)
            </h1>
          </div>
          <div style="padding: 30px 24px; color: #1e293b;">
            <div style="display: inline-block; padding: 4px 10px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 11px; font-weight: 700; color: #00568a; margin-bottom: 16px;">
              ✓ Email Authenticity Verified via bmes@cuet.ac.bd
            </div>
            <h2 style="margin: 0 0 14px 0; font-size: 18px; font-weight: 700; color: #00568a;">
              Membership Application Successfully Received!
            </h2>
            <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Dear <strong>${name}</strong>,
            </p>
            <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              We have officially received your membership registration for the <strong>CUET Biomedical Engineering Society</strong>. Your university email address (<strong>${email}</strong>) has been verified.
            </p>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Your application is now under review by the Executive Committee. You will receive an official notification email once your membership status is finalized and your official BMES ID is issued.
            </p>
            <div style="padding: 14px; background-color: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; line-height: 1.5;">
              <strong>Application Tracking:</strong> You can view the live status of your application anytime directly in the <a href="${APP_URL}/portal?tab=membership" style="color: #00568a; font-weight: bold; text-decoration: underline;">BMES Student Portal</a>.
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">Executive Committee • Biomedical Engineering Society, CUET</p>
            <p style="margin: 0; color: #94a3b8;">Official Desk: bmes@cuet.ac.bd</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-membership-status", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    console.error("GMAIL_APP_PASSWORD is not set");
    return res.status(500).json({ error: "Email service is not configured on the server." });
  }

  const { email, name, status, reason } = req.body;

  if (!email || !name || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const isApproved = status === 'approved';
  const subject = isApproved 
    ? "Welcome to CUET BMES Society!" 
    : "Update on your BMES Membership Application";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h1 style="color: ${isApproved ? '#00568a' : '#ef4444'};">${isApproved ? 'Application Approved!' : 'Application Update'}</h1>
      <p>Hi ${name},</p>
      <p>Your membership application for the <strong>CUET Biomedical Engineering Society</strong> has been <strong>${status}</strong>.</p>
      
      ${isApproved ? `
        <p>Congratulations! You are now an official member. You can now access exclusive resources and features in the student portal.</p>
        <div style="margin: 30px 0;">
          <a href="${APP_URL}/portal" style="background-color: #00568a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Student Portal</a>
        </div>
      ` : `
        <p>We regret to inform you that your application was not approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this is a mistake, please feel free to reach out to us or re-apply with corrected information.</p>
      `}
      
      <br/>
      <p>Best regards,</p>
      <p><strong>CUET BMES Executive Committee</strong></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      replyTo: OFFICIAL_REPLY_TO,
      to: email,
      subject: subject,
      html: html,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-welcome", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    console.error("GMAIL_APP_PASSWORD is not set");
    return res.status(500).json({ error: "Email service is not configured on the server." });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      replyTo: OFFICIAL_REPLY_TO,
      to: email,
      subject: "Welcome to CUET BMES Society!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #00568a;">Welcome to the Society!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for creating an account with the <strong>CUET Biomedical Engineering Society</strong>.</p>
          <p>We're excited to have you as part of our community!</p>
          <p>You can now explore our events, projects, and research activities. If you haven't already, consider applying for official membership through the student portal.</p>
          <div style="margin: 30px 0;">
            <a href="${APP_URL}/portal" style="background-color: #00568a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Student Portal</a>
          </div>
          <br/>
          <p>Best regards,</p>
          <p><strong>CUET BMES Team</strong></p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to generate professional bulk announcement/reminder emails
function generateBulkEmailHtml({
  recipientName,
  subject,
  message,
  emailType = "announcement",
  actionButtonText,
  actionButtonUrl,
  appUrl,
}: {
  recipientName: string;
  subject: string;
  message: string;
  emailType?: string;
  actionButtonText?: string;
  actionButtonUrl?: string;
  appUrl: string;
}) {
  let accentColor = "#00568a"; // CUET Blue
  let badgeText = "OFFICIAL ANNOUNCEMENT";
  let badgeBg = "#f0f9ff";
  let badgeBorder = "#bae6fd";
  let badgeTextColor = "#0369a1";

  if (emailType === "reminder") {
    accentColor = "#f59e0b"; // amber
    badgeText = "IMPORTANT REMINDER";
    badgeBg = "#fffbeb";
    badgeBorder = "#fde68a";
    badgeTextColor = "#92400e";
  } else if (emailType === "urgent") {
    accentColor = "#ef4444"; // rose/red
    badgeText = "URGENT NOTICE";
    badgeBg = "#fef2f2";
    badgeBorder = "#fecaca";
    badgeTextColor = "#991b1b";
  } else if (emailType === "general") {
    accentColor = "#3b82f6"; // blue
    badgeText = "GENERAL UPDATE";
    badgeBg = "#eff6ff";
    badgeBorder = "#bfdbfe";
    badgeTextColor = "#1e40af";
  }

  const cleanName = recipientName ? recipientName.trim() : "Member";
  const personalizedMessage = message.replace(/\{name\}/gi, cleanName);

  const formattedParagraphs = personalizedMessage
    .split(/\n\s*\n/)
    .map((para) => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #334155;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const buttonHtml = (actionButtonText && actionButtonUrl) ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${actionButtonUrl}" target="_blank" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ${actionButtonText} &rarr;
      </a>
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <tr>
                <td style="background-color: ${accentColor}; height: 5px;"></td>
              </tr>
              <tr>
                <td style="padding: 24px 32px 18px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
                          CUET Biomedical Engineering Society
                        </h3>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">
                          Chittagong University of Engineering & Technology
                        </p>
                      </td>
                      <td align="right">
                        <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeBorder}; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
                          ${badgeText}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.35;">
                    ${subject}
                  </h1>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e293b;">
                    Dear ${cleanName},
                  </p>

                  <div style="color: #334155;">
                    ${formattedParagraphs}
                  </div>

                  ${buttonHtml}

                  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">
                      Best regards,
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                      Executive Committee & Administration<br/>
                      <strong>CUET Biomedical Engineering Society</strong>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                    You are receiving this official communication as a registered student or member of the CUET Biomedical Engineering Society.
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
                    <a href="${appUrl}" style="color: ${accentColor}; text-decoration: underline;">Visit Society Website</a> &bull;
                    <a href="${appUrl}/portal" style="color: ${accentColor}; text-decoration: underline;">Student Portal</a> &bull;
                    <a href="${appUrl}/events" style="color: ${accentColor}; text-decoration: underline;">Events</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Bulk email endpoint for announcements, reminders, and updates
app.post("/api/send-bulk-email", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    console.error("GMAIL_APP_PASSWORD is not configured in environment.");
    return res.status(500).json({ 
      error: "Email service is not configured. Please ensure GMAIL_APP_PASSWORD is set." 
    });
  }

  const {
    recipients,
    subject,
    message,
    emailType = "announcement",
    actionButtonText,
    actionButtonUrl
  } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: "Email subject is required." });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Email message content is required." });
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "At least one recipient is required." });
  }

  // Deduplicate and validate email addresses
  const validRecipients: { email: string; name: string }[] = [];
  const seenEmails = new Set<string>();

  for (const item of recipients) {
    const email = (typeof item === "string" ? item : item?.email || "").trim().toLowerCase();
    const name = (typeof item === "object" ? item?.name || item?.full_name : "") || "";
    
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !seenEmails.has(email)) {
      seenEmails.add(email);
      validRecipients.push({ email, name: name.trim() });
    }
  }

  if (validRecipients.length === 0) {
    return res.status(400).json({ error: "No valid email addresses found in the recipient list." });
  }

  const results = {
    total: validRecipients.length,
    sent: 0,
    failed: 0,
    errors: [] as { email: string; error: string }[],
  };

  // Send in controlled batches of 4 with a 150ms delay between batches to stay within Gmail limits
  const BATCH_SIZE = 4;
  for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
    const batch = validRecipients.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (recipient) => {
        try {
          const htmlContent = generateBulkEmailHtml({
            recipientName: recipient.name,
            subject: subject.trim(),
            message: message.trim(),
            emailType,
            actionButtonText: actionButtonText?.trim() || undefined,
            actionButtonUrl: actionButtonUrl?.trim() || undefined,
            appUrl: APP_URL,
          });

          await transporter.sendMail({
            from: `CUET BMES <${FROM_EMAIL}>`,
            replyTo: OFFICIAL_REPLY_TO,
            to: recipient.email,
            subject: subject.trim(),
            html: htmlContent,
          });

          results.sent++;
        } catch (err: unknown) {
          results.failed++;
          const errorMessage = err instanceof Error ? err.message : "Failed to send";
          console.error(`Failed to send email to ${recipient.email}:`, errorMessage);
          results.errors.push({ email: recipient.email, error: errorMessage });
        }
      })
    );

    // Brief cooldown between batches
    if (i + BATCH_SIZE < validRecipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return res.json({
    success: true,
    summary: results,
    message: `Dispatched ${results.sent} of ${results.total} emails successfully.${results.failed > 0 ? ` (${results.failed} failed)` : ""}`
  });
});

// Single test email endpoint so admins can test formatting before sending to all users
app.post("/api/send-test-email", async (req, res) => {
  if (!GMAIL_APP_PASSWORD) {
    return res.status(500).json({ 
      error: "Email service is not configured. Please ensure GMAIL_APP_PASSWORD is set." 
    });
  }

  const {
    testEmail,
    testName = "Admin Preview",
    subject = "Test Announcement",
    message = "This is a preview test of the announcement.",
    emailType = "announcement",
    actionButtonText,
    actionButtonUrl
  } = req.body;

  if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
    return res.status(400).json({ error: "Please provide a valid test email address." });
  }

  try {
    const htmlContent = generateBulkEmailHtml({
      recipientName: testName,
      subject: `[TEST PREVIEW] ${subject.trim()}`,
      message: message.trim(),
      emailType,
      actionButtonText: actionButtonText?.trim() || undefined,
      actionButtonUrl: actionButtonUrl?.trim() || undefined,
      appUrl: APP_URL,
    });

    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      replyTo: OFFICIAL_REPLY_TO,
      to: testEmail.trim(),
      subject: `[TEST PREVIEW] ${subject.trim()}`,
      html: htmlContent,
    });

    return res.json({ success: true, message: `Test email sent to ${testEmail.trim()}` });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send test email";
    console.error("Test email send error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

export default app;
