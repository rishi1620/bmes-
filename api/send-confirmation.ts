import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, eventTitle } = request.body;

  if (!email || !name || !eventTitle) {
    return response.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'BMES Club <onboarding@resend.dev>', // Replace with your verified domain in production
      to: [email],
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <h1>Registration Confirmed!</h1>
        <p>Hi ${name},</p>
        <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
        <p>We look forward to seeing you there!</p>
        <br/>
        <p>Best regards,</p>
        <p>BMES Club Team</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return response.status(500).json({ error: error.message });
    }

    return response.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
