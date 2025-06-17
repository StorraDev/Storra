import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const sendTestEmail = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Test Sender" <${process.env.ADMIN_EMAIL}>`,
    to: 'storradev@gmail.com',
    subject: 'Terminal Test Email',
    text: 'This is a test email sent directly from terminal!',
    html: '<h1>Terminal Test</h1><p>This is a <b>test email</b> sent from terminal.</p>'
  });

  console.log('Test email sent!');
};

sendTestEmail().catch(console.error);