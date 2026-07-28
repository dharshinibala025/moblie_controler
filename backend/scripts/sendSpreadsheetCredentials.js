require("dotenv").config();
const path = require("path");
const xlsx = require("xlsx");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Set TESTING_ONLY to true for test mode (sends emails ONLY to Dharani & Ashok).
// Set to false when ready to dispatch emails to ALL students in the spreadsheet.
const TESTING_ONLY = true;
const TEST_TARGET_EMAILS = [
  "vvdharani57cse24_27@ksrce.ac.in",
  "ashoklinga2006cse24_27@ksrce.ac.in"
];

const sendSpreadsheetCredentials = async () => {
  try {
    const excelPath = path.join(__dirname, "..", "Smart_Classroom_Complete_Import_Template.xlsx");
    const workbook = xlsx.readFile(excelPath);

    const studentsSheet = workbook.Sheets["Students"];
    const studentsData = xlsx.utils.sheet_to_json(studentsSheet);

    console.log("=====================================================================");
    console.log("  SPREADSHEET TEMPORARY CREDENTIAL EMAIL DISPATCHER");
    console.log("=====================================================================");
    console.log(`  Source File:  ${excelPath}`);
    console.log(`  Total Roster: ${studentsData.length} Students`);
    console.log(`  Mode:         ${TESTING_ONLY ? "TESTING ONLY (Dharani & Ashok)" : "FULL CLASS DISPATCH"}`);
    console.log("=====================================================================\n");

    let dispatchedCount = 0;

    const testRecipients = [
      { name: "V V Dharani", email: "vvdharani57cse24_27@ksrce.ac.in", tempPassword: "Temp@123" },
      { name: "Ashok Linga", email: "ashoklinga2006cse24_27@ksrce.ac.in", tempPassword: "Temp@123" },
    ];

    if (TESTING_ONLY) {
      for (const target of testRecipients) {
        console.log(`  [SENDING TEST EMAIL] Sending temporary credentials to: ${target.name} (${target.email})...`);
        const result = await emailService.sendTemporaryPasswordEmail({
          toEmail: target.email,
          name: target.name,
          tempPassword: target.tempPassword,
          role: "student",
        });

        if (result.success) {
          console.log(`  [SUCCESS] Temporary password email dispatched to ${target.email}`);
          dispatchedCount++;
        } else {
          console.log(`  [FAILED] Could not send to ${target.email}: ${result.error}`);
        }
      }
    } else {
      for (const row of studentsData) {
        const studentEmail = (row["Email"] || "").trim().toLowerCase();
        const studentName = row["Student Name"] || "Student";
        const tempPassword = row["Temporary Password"] || "Temp@123";

        console.log(`  [SENDING EMAIL] Sending temporary credentials to: ${studentName} (${studentEmail})...`);
        const result = await emailService.sendTemporaryPasswordEmail({
          toEmail: studentEmail,
          name: studentName,
          tempPassword: tempPassword,
          role: "student",
        });

        if (result.success) {
          console.log(`  [SUCCESS] Email dispatched to ${studentEmail}`);
          dispatchedCount++;
        } else {
          console.log(`  [FAILED] Could not send to ${studentEmail}: ${result.error}`);
        }
      }
    }

    console.log("\n=====================================================================");
    console.log(`  DISPATCH COMPLETE: ${dispatchedCount} email(s) sent successfully.`);
    console.log("=====================================================================\n");

  } catch (err) {
    logger.error(`Credential dispatch script failed: ${err.message}`);
    console.error(err);
  }
};

sendSpreadsheetCredentials();
