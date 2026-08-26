import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import { generateSitemapRoutes, buildSitemapXml } from "../src/lib/sitemapGenerator.ts";
import { notificationHub } from "./notificationHub.ts";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  }
});
const FROM_EMAIL = process.env.GMAIL_USER;
const APP_URL = process.env.APP_URL || "https://cuetbmes.vercel.app";

const app = express();
app.use(cors());
app.use(express.json());

// Real-time Notification Endpoints for Admin
app.get("/api/notifications/recent", (req, res) => {
  res.json({ notifications: notificationHub.getRecent() });
});

app.post("/api/notifications/broadcast", (req, res) => {
  const { type, title, description, metadata } = req.body;
  if (!title || !type) {
    return res.status(400).json({ error: "Missing required notification fields (title, type)" });
  }

  const notification = notificationHub.broadcast({
    type,
    title,
    description: description || "",
    metadata: metadata || {},
  });

  res.json({ success: true, notification });
});

// Dynamic Sitemap endpoint for search engines and SEO crawlers
app.get(["/sitemap.xml", "/api/sitemap"], async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const currentBaseUrl = host ? `${protocol}://${host}` : APP_URL;

    const routes = await generateSitemapRoutes();
    const xml = buildSitemapXml(routes, currentBaseUrl);

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=3600, s-maxage=86400");
    return res.send(xml);
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
    return res.status(500).send("Error generating sitemap");
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Server-side Gemini AI Proxy for Study Material
app.post("/api/gemini/study", async (req, res) => {
  const { prompt, fileContent, mode = "general", chatHistory = [] } = req.body;
  if (!prompt && !fileContent) {
    return res.status(400).json({ error: "Missing prompt or file content" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const modeInstructions: Record<string, string> = {
      summary: "Create a concise yet comprehensive summary of the provided material. Use bullet points for key takeaways and bold important terms.",
      quiz: "Generate a set of 5-10 multiple-choice or short-answer questions based on the material to test understanding. Include an answer key at the end.",
      concepts: "Identify and explain the core theoretical concepts and formulas found in the material. Provide real-world biomedical engineering examples where applicable.",
      plan: "Create a structured 1-week study schedule to master this topic. Break it down into daily goals and suggest specific sub-topics to focus on.",
      explain: "Explain the complex parts of this topic as if you were teaching a fellow student. Use analogies and simplify technical jargon without losing accuracy.",
      general: "Provide a helpful response based on the user's request and any provided material."
    };

    const systemInstruction = `You are an expert academic assistant for Biomedical Engineering students at CUET. 
    Your goal is to provide high-quality, university-level academic support. 
    Task: ${modeInstructions[mode] || modeInstructions.general}
    Tone: Professional, academic, encouraging, and precise.
    Format: Use clean Markdown with clear headings, lists, and bold text for emphasis.
    Context: If file content is provided, prioritize it as the primary source of truth.`;

    const contentText = fileContent 
      ? "CONTEXT MATERIAL (PDF CONTENT):\n" + fileContent + "\n\nUSER SPECIFIC REQUEST: " + prompt
      : "USER REQUEST: " + prompt;

    const contents = [
      ...chatHistory,
      { role: "user", parts: [{ text: contentText }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return res.json({ text: response.text });
  } catch (err: unknown) {
    console.error("Gemini API error in /api/gemini/study:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to generate study material";
    return res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create stateless verification token
  const secret = process.env.GMAIL_APP_PASSWORD || "fallback-secret-key-123";
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
  const dataToHash = `${email}:${otp}:${expiresAt}`;
  const hash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");
  const verificationToken = `${expiresAt}.${hash}`;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(`[OTP Fallback] Email service unconfigured. Generated demo OTP for ${email}: ${otp}`);
    return res.json({
      success: true,
      verificationToken,
      demoCode: otp,
      notice: `Email service unconfigured on server. Demo verification code: ${otp}`,
    });
  }

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      to: email,
      subject: "Your Event Registration Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #10b981;">Verification Code</h1>
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
    console.error("Failed to send OTP email:", err);
    // Return token and demoCode so user isn't permanently blocked
    res.json({
      success: true,
      verificationToken,
      demoCode: otp,
      notice: "Email delivery failed; use fallback code.",
    });
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

app.post("/api/send-confirmation", async (req, res) => {
  const { email, name, eventTitle } = req.body;

  if (!email || !name || !eventTitle) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Broadcast real-time notification to admin clients
  notificationHub.broadcast({
    type: "registration",
    title: "New Event Registration",
    description: `${name} registered for ${eventTitle}`,
    metadata: { email, name, eventTitle },
  });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials are not set; event registration notification broadcasted without email.");
    return res.json({ success: true, notice: "Registration recorded (email service unconfigured)" });
  }

  try {
    await transporter.sendMail({
      from: `BMES Society <${FROM_EMAIL}>`,
      to: email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #10b981; font-size: 24px; margin-top: 0;">Registration Confirmed!</h1>
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
    res.json({ success: true, notice: "Registration recorded; email delivery failed." });
  }
});

app.post("/api/send-membership-confirmation", async (req, res) => {
  const { email, name, studentId, department } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Broadcast real-time notification to admin clients
  notificationHub.broadcast({
    type: "membership",
    title: "New Membership Application",
    description: `${name} (${email}) submitted a new membership application.`,
    metadata: { email, name, studentId, department },
  });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials are not set; notification broadcasted without email.");
    return res.json({ success: true, notice: "Notification sent (email service unconfigured)" });
  }

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
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

    res.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/send-membership-status", async (req, res) => {
  const { email, name, status, reason } = req.body;

  if (!email || !name || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials are not set; membership status updated without email dispatch.");
    return res.json({ success: true, notice: "Status updated (email service unconfigured)" });
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
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Server error sending status email:", err);
    res.json({ success: true, notice: "Status recorded; email dispatch failed." });
  }
});

app.post("/api/send-welcome", async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials are not set; user welcome logged without email dispatch.");
    return res.json({ success: true, notice: "Welcome logged (email service unconfigured)" });
  }

  try {
    await transporter.sendMail({
      from: `CUET BMES <${FROM_EMAIL}>`,
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

    res.json({ success: true });
  } catch (err) {
    console.error("Server error sending welcome email:", err);
    res.json({ success: true, notice: "Account created; welcome email failed." });
  }
});

export default app;
