import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbInsert } from '@/lib/supabase';
import { generateId, generateOTP } from '@/lib/utils';
import nodemailer from 'nodemailer';

// Create transporter only if SMTP credentials are available
let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // For development, set to true in production
    }
  });
  
  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP configuration error:', error);
    } else {
      console.log('✅ SMTP server is ready to send emails');
    }
  });
} else {
  console.log('⚠️  SMTP not configured - emails will not be sent');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await dbGet('users', { email }, 'id, name') as any;
    if (!user || !user.id) {
      // Don't reveal if user exists for security
      return NextResponse.json({ message: 'If the email exists, an OTP has been sent' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '600000'));

    // Save OTP
    await dbInsert('otp_codes', {
      email,
      code: otp,
      expires_at: expiresAt.toISOString(),
      used: 0
    });

    // Send email (if configured)
    if (transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: 'StockMaster - Password Reset OTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0284c7;">Password Reset Request</h2>
              <p>Hello ${user.name},</p>
              <p>You requested to reset your password for StockMaster.</p>
              <div style="background-color: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #666;">Your OTP code is:</p>
                <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #0284c7; letter-spacing: 4px;">${otp}</p>
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">This is an automated message from StockMaster Inventory Management System.</p>
            </div>
          `
        });
        console.log(`✅ OTP email sent successfully to ${email}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send email:', emailError);
        // Log OTP to console for development/debugging
        console.log(`⚠️  Email sending failed. OTP for ${email}: ${otp}`);
        // Don't throw error - still return success to user for security
      }
    } else {
      // Development mode: log OTP to console
      console.log(`⚠️  SMTP not configured. OTP for ${email}: ${otp}`);
      console.log('📧 To enable email sending, add SMTP configuration to .env.local');
    }

    return NextResponse.json({ message: 'If the email exists, an OTP has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}