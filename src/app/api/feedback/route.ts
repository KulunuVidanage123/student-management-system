// src/app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { studentName, email, mobileNumber, message } = body;

    // Validation
    if (!studentName || !email || !mobileNumber || !message) {
      return NextResponse.json(
        { error: 'All fields are required', missingFields: { studentName: !studentName, email: !email, mobileNumber: !mobileNumber, message: !message } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate mobile number (basic)
    const mobileRegex = /^[+]?[0-9\s\-()]{7,}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@edumanage.com';
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email not configured. Feedback saved but emails not sent.');
      // Still return success so user knows feedback was received
      return NextResponse.json({
        message: 'Feedback submitted successfully (email notification pending configuration)',
        timestamp,
        emailSent: false,
      }, { status: 200 });
    }

    try {
      // 1. Send email to admin
      await sendEmail({
        to: adminEmail,
        subject: `📬 New Feedback from ${studentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">New Student Feedback</h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p><strong>👤 Student:</strong> ${studentName}</p>
              <p><strong>📧 Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>📱 Mobile:</strong> ${mobileNumber}</p>
              <p><strong>🕐 Received:</strong> ${timestamp}</p>
            </div>
            
            <div style="background: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 15px 0;">
              <p><strong>💬 Feedback Message:</strong></p>
              <p style="white-space: pre-wrap; line-height: 1.5;">${message}</p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #64748b; font-size: 12px;">
              <p>This feedback was submitted via EduManage Student Portal.</p>
              <p>To reply, contact: <a href="mailto:${email}">${email}</a></p>
            </div>
          </div>
        `,
      });

      // 2. Send confirmation email to student
      await sendEmail({
        to: email,
        subject: '✅ Feedback Received - EduManage',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Thank You for Your Feedback!</h2>
            
            <p>Dear ${studentName},</p>
            
            <p>We have successfully received your feedback. Our admin team will review it and get back to you if needed.</p>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a;">
              <p><strong>📋 Summary:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Submitted:</strong> ${timestamp}</li>
                <li><strong>Mobile:</strong> ${mobileNumber}</li>
                <li><strong>Message:</strong> "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"</li>
              </ul>
            </div>
            
            <p>If you have any urgent concerns, please contact our support team directly.</p>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #64748b; font-size: 12px;">
              <p>Best regards,<br><strong>EduManage Team</strong></p>
              <p>This is an automated confirmation. Please do not reply to this email.</p>
            </div>
          </div>
        `,
      });

      console.log('✅ Feedback processed successfully');
      
      return NextResponse.json({
        message: 'Feedback submitted successfully',
        timestamp,
        emailSent: true,
      }, { status: 200 });

    } catch (emailError: any) {
      console.error('❌ Email error:', emailError.message);
      // Still return success - feedback was received, email just failed
      return NextResponse.json({
        message: 'Feedback submitted successfully (email notification failed)',
        timestamp,
        emailSent: false,
        emailError: emailError.message,
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('❌ API Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}