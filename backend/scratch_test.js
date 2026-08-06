require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("SMTP Config:");
console.log("Host:", process.env.SMTP_HOST);
console.log("Port:", process.env.SMTP_PORT);
console.log("Email:", process.env.SMTP_EMAIL);
console.log("Pass exists:", !!(process.env.SMTP_PASS || process.env.SMTP_APP_PASSWORD));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // 587 uses TLS, not SSL
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Verification failed:", error);
  } else {
    console.log("Server is ready to take our messages!");
    
    // Attempt sending a test email
    transporter.sendMail({
      from: `"Test Portal" <${process.env.SMTP_EMAIL}>`,
      to: "vvdharani57cse24_27@ksrce.ac.in",
      subject: "FocusSync SMTP Test Mail",
      text: "This is a test to verify SMTP configuration.",
    }).then(info => {
      console.log("Test email sent successfully!", info.messageId);
      process.exit(0);
    }).catch(err => {
      console.error("Failed to send test email:", err);
      process.exit(1);
    });
  }
});
