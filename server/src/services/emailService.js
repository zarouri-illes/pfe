const nodemailer = require('nodemailer');

/**
 * Basic Email Service for BacPrep Hub
 * Uses a simple transporter. In development, it can log to console 
 * if SMTP details are missing.
 */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (options) => {
  // If no SMTP details, fallback to console log in development
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === '') {
    console.log('\x1b[33m%s\x1b[0m', '--- 📧 SIMULATION EMAIL ---');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Code:', options.text.match(/\d{6}/)?.[0] || 'N/A');
    console.log('\x1b[33m%s\x1b[0m', '---------------------------');
    return { messageId: 'simulated-id' };
  }

  const mailOptions = {
    from: `"BacPrep Hub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Sends a 6-digit verification code to the user
 */
const sendVerificationCode = async (email, code) => {
  const subject = 'Code de vérification - BacPrep Hub';
  const text = `Votre code de vérification est : ${code}. Ce code expire dans 15 minutes.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
      <h2 style="color: #4f46e5; text-align: center;">Bienvenue sur BacPrep Hub</h2>
      <p>Merci de vous être inscrit ! Pour activer votre compte, veuillez utiliser le code de vérification suivant :</p>
      <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; border-radius: 8px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #64748b; font-size: 14px;">Ce code expirera dans 15 minutes. Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 BacPrep Hub. Tous droits réservés.</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationCode
};
