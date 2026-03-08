/**
 * utils/email.utils.js
 * 
 * Handles sending emails for verification and password reset via Nodemailer.
 */

const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer.
 * 
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
    // 1. Create a transporter
    // For Production, use Gmail, SendGrid, Mailtrap, etc.
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. Define email options
    const mailOptions = {
        from: `QuizApp <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

// Common CSS for email templates matching the UI
const emailStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
    body, * {
        font-family: 'Outfit', sans-serif;
    }
`;

/**
 * Send Account Verification Email
 */
const sendVerificationEmail = async (user, rawToken) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;

    const message = `Welcome to QuizApp! Please verify your account by clicking: ${verificationUrl}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${emailStyles}</style>
        </head>
        <body style="background-color: #050210; color: #ffffff; margin: 0; padding: 40px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
                <h2 style="color: #ffffff; font-size: 28px; font-weight: 700; margin-top: 0; letter-spacing: -0.5px;">Welcome to Quizard</h2>
                <p style="color: #a0aab2; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Thank you for joining. To ensure the security of your account and complete your registration, please verify your email address.
                </p>
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, rgba(88,101,242,1) 0%, rgba(146,84,255,1) 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: inset 0 2px 2px rgba(255, 255, 255, 0.2), inset 0 -4px 6px rgba(0, 0, 0, 0.4), 0 4px 15px rgba(146, 84, 255, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                    Verify My Account
                </a>
                <p style="margin-top: 40px; font-size: 13px; color: #5a646e;">
                    If you did not create an account with Quizard, please safely ignore this email.
                </p>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Verify your QuizApp Account',
        message,
        html,
    });
};

/**
 * Send Password Reset Email
 */
const sendResetEmail = async (user, rawToken) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

    const message = `You requested a password reset. Please use the following link: ${resetUrl}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${emailStyles}</style>
        </head>
        <body style="background-color: #050210; color: #ffffff; margin: 0; padding: 40px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
                <h2 style="color: #ffffff; font-size: 28px; font-weight: 700; margin-top: 0; letter-spacing: -0.5px;">Reset Your Password</h2>
                <p style="color: #a0aab2; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    We received a request to reset your password for your Quizard account. Please use the button below to continue securely.
                </p>
                <a href="${resetUrl}" style="background: linear-gradient(135deg, rgba(88,101,242,1) 0%, rgba(146,84,255,1) 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: inset 0 2px 2px rgba(255, 255, 255, 0.2), inset 0 -4px 6px rgba(0, 0, 0, 0.4), 0 4px 15px rgba(146, 84, 255, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                    Reset Password
                </a>
                <p style="margin-top: 40px; font-size: 13px; color: #5a646e;">
                    This link is valid for 30 minutes. If you did not request a password reset, you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message,
        html,
    });
};

module.exports = { sendVerificationEmail, sendResetEmail };
