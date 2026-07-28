require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER || 'mobilecontrol07@gmail.com';
  const pass = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS || '';

  console.log('--- EMAIL DISPATCH DIAGNOSTIC ---');
  console.log('SMTP Host:', host);
  console.log('SMTP Port:', port);
  console.log('SMTP User:', user);
  console.log('SMTP Pass Configured:', pass ? 'YES (Key length: ' + pass.length + ')' : 'NO (EMPTY)');

  if (!pass) {
    console.log('\n❌ RESULT: SMTP_APP_PASSWORD is empty in backend/.env!');
    console.log('Nodemailer cannot connect to Gmail SMTP without an App Password.');
    console.log('To send real emails:');
    console.log('1. Go to https://myaccount.google.com for mobilecontrol07@gmail.com');
    console.log('2. Enable 2-Step Verification -> Search "App Passwords" -> Create password');
    console.log('3. Paste the 16-character code into backend/.env at SMTP_APP_PASSWORD=');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    console.log('\nAttempting live SMTP connection to Gmail...');
    await transporter.verify();
    console.log('✅ SMTP Connection Successful!');

    console.log('\nSending test email to vvdharani57cse24_27@ksrce.ac.in...');
    const info = await transporter.sendMail({
      from: `"Smart Classroom Portal" <${user}>`,
      to: 'vvdharani57cse24_27@ksrce.ac.in',
      subject: 'Smart Classroom — Test Email Verification',
      text: 'Temporary Password Test: Temp@123',
    });
    console.log('✅ Email Dispatched Successfully! MessageId:', info.messageId);
  } catch (err) {
    console.error('❌ SMTP Dispatch Error:', err.message);
  }
}

testEmail();
