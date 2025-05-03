import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, username } = req.body;
    
    // Validate required fields
    if (!userId || !email || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate simple verification token - we'll encode the user ID and a timestamp
    // This eliminates the need for a separate VerificationTokens table
    const timestamp = new Date().getTime();
    const randomString = uuidv4().substring(0, 8);
    const token = Buffer.from(`${userId}:${timestamp}:${randomString}`).toString('base64');

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verification URL with the verification token
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    // Email content
    const mailOptions = {
      from: `"NexusQuiz AI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your NexusQuiz AI Account',
      text: `Hello ${username},\n\nWelcome to NexusQuiz AI! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.\n\nBest regards,\nThe NexusQuiz AI Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Welcome to NexusQuiz AI!</h1>
          <p>Hello ${username},</p>
          <p>Thank you for joining NexusQuiz AI. Please verify your email address by clicking the button below:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>The NexusQuiz AI Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ 
      success: true,
      message: 'Verification email sent successfully' 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send verification email',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}