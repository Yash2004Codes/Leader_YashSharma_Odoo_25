import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbInsert } from '@/lib/supabase';
import { generateId, generateOTP } from '@/lib/utils';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: email,
          subject: 'StockMaster - Password Reset OTP',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>Your OTP for password reset is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.log('Email not configured. OTP:', otp);
      }
    } else {
      console.log('Email not configured. OTP for', email, ':', otp);
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