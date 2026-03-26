import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const APP_URL = process.env.APP_URL || "https://cuetbmes.vercel.app";

const app = express();
app.use(cors());
app.use(express.json());

// Helper to check config and get transporter
const getTransporter = (res: express.Response) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("GMAIL_USER or GMAIL_APP_PASSWORD is not set");
    res.status(500).json({ error: "Email service is not configured on the server." });
    return null;
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/send-confirmation", async (req, res) => {
  const transporter = getTransporter(res);
  if (!transporter) return;

  const { email, name, eventTitle } = req.body;

  if (!email || !name || !eventTitle) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const info = await transporter.sendMail({
      from: `"BMES Society" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #10b981;">Registration Confirmed!</h1>
          <p>Hi ${name},</p>
          <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
          <p>We look forward to seeing you there!</p>
          <br/>
          <p>Best regards,</p>
          <p>BMES Society Team</p>
        </div>
      `,
    });

    res.json({ success: true, data: info.messageId });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-membership-confirmation", async (req, res) => {
  const transporter = getTransporter(res);
  if (!transporter) return;

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const info = await transporter.sendMail({
      from: `"CUET BMES" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Membership Application Received",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #3b82f6;">Application Received!</h1>
          <p>Hi ${name},</p>
          <p>We have successfully received your membership application for the <strong>CUET Biomedical Engineering Society</strong>.</p>
          <p>Your application is currently under review by the executive committee. We will notify you via email once your status is updated.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>CUET BMES Executive Committee</strong></p>
        </div>
      `,
    });

    res.json({ success: true, data: info.messageId });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-membership-status", async (req, res) => {
  const transporter = getTransporter(res);
  if (!transporter) return;

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
      <h1 style="color: ${isApproved ? '#10b981' : '#ef4444'};">${isApproved ? 'Application Approved!' : 'Application Update'}</h1>
      <p>Hi ${name},</p>
      <p>Your membership application for the <strong>CUET Biomedical Engineering Society</strong> has been <strong>${status}</strong>.</p>
      
      ${isApproved ? `
        <p>Congratulations! You are now an official member. You can now access exclusive resources and features in the student portal.</p>
        <div style="margin: 30px 0;">
          <a href="${APP_URL}/portal" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Student Portal</a>
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
    const info = await transporter.sendMail({
      from: `"CUET BMES" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
    });

    res.json({ success: true, data: info.messageId });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-welcome", async (req, res) => {
  const transporter = getTransporter(res);
  if (!transporter) return;

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const info = await transporter.sendMail({
      from: `"CUET BMES" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to CUET BMES Society!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #10b981;">Welcome to the Society!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for creating an account with the <strong>CUET Biomedical Engineering Society</strong>.</p>
          <p>We're excited to have you as part of our community!</p>
          <p>You can now explore our events, projects, and research activities. If you haven't already, consider applying for official membership through the student portal.</p>
          <div style="margin: 30px 0;">
            <a href="${APP_URL}/portal" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Student Portal</a>
          </div>
          <br/>
          <p>Best regards,</p>
          <p><strong>CUET BMES Team</strong></p>
        </div>
      `,
    });

    res.json({ success: true, data: info.messageId });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
