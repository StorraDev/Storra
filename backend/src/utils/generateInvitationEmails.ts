// emailUtils.ts
import nodemailer from 'nodemailer';
import { AdminLevel } from '../types/adminTypes';
import { join } from "path";
import dotenv from 'dotenv';

dotenv.config({path: join(__dirname, "../../.env")});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.ADMIN_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },

  logger: true,
  debug: true    
});

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
  } catch (error) {
    console.error('❌ Email configuration error:', error);
  }
};

// Send admin invitation email
export const sendInvitationEmail = async (
  email: string = 'storradev@gmail.com', 
  invitationToken: string, 
  adminLevel: AdminLevel
) => {
  try {
    const invitationUrl = process.env.FRONTEND_URL 
  ? `${process.env.FRONTEND_URL}/admin/accept-invitation?token=${invitationToken}`
  : `TOKEN: ${invitationToken}\n\nFrontend URL not configured - use this token when your frontend is ready.`;
    const adminLevelText = {
      [AdminLevel.SUPER_ADMIN]: 'Super Administrator',
      [AdminLevel.MAIN_ADMIN]: 'Main Administrator',
      [AdminLevel.MINOR_ADMIN]: 'Minor Administrator',
    };

    const mailOptions = {
      from: {
        name: process.env.APP_NAME || 'STORRA',
        address: process.env.ADMIN_EMAIL || 'chukwudiconfidenceosinachi@gmail.com',
      },
      to: email,
      subject: `Admin Invitation - ${adminLevelText[adminLevel]}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; }
            .button { 
              background: #007bff; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              display: inline-block; 
              margin: 20px 0;
            }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Admin Invitation</h1>
            </div>
            <div class="content">
              <h2>You've been invited as a ${adminLevelText[adminLevel]}</h2>
              <p>Hello,</p>
              <p>You have been invited to join our platform as a <strong>${adminLevelText[adminLevel]}</strong>.</p>
              <p>Click the button below to accept your invitation and set up your admin account:</p>
              
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 3px;">
                ${invitationUrl}
              </p>
              
              <div class="warning">
                <strong>Important:</strong> This invitation will expire in 7 days. 
                If you don't accept it within this time, you'll need to request a new invitation.
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>The Admin Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Admin Invitation - ${adminLevelText[adminLevel]}
        
        You have been invited to join our platform as a ${adminLevelText[adminLevel]}.
        
        Click the link below to accept your invitation and set up your admin account:
        ${invitationUrl}
        
        This invitation will expire in 7 days.
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Admin Team
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Invitation email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};

// Send password reset email (for admins)
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: process.env.APP_NAME || 'Your App',
        address: process.env.SMTP_EMAIL || 'noreply@yourapp.com',
      },
      to: email,
      subject: 'Admin Password Reset',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; }
            .button { 
              background: #dc3545; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              display: inline-block; 
              margin: 20px 0;
            }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <h2>Reset Your Admin Password</h2>
              <p>Hello,</p>
              <p>You have requested to reset your admin password. Click the button below to set a new password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 3px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>Important:</strong> This reset link will expire in 1 hour for security reasons.
                If you didn't request this password reset, please ignore this email.
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>The Admin Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Add this at the end of your file
(async () => {
  try {
    // First verify your email config
    await verifyEmailConfig();
    
    // Then send a test invitation
    await sendInvitationEmail(
      undefined, // Will use default 'storradev@gmail.com'
      'test-token-123', 
      AdminLevel.MINOR_ADMIN
    );
    
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
})();