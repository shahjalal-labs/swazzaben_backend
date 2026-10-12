import { Worker } from "bullmq";
import redisClient from "../helpers/radis";
import { sendEmail } from "../helpers/sendEmail";
import { forgotPasswordHtml, otpHtml } from "../app/constant";
import { businessLoanFunctions } from "../app/modules/businessloan/businessLoan.service";

new Worker(
  "email",
  async (job) => {
    console.log("iam form email worker ");
    const { email, fullName, otp } = job.data;
    let subject = "";
    let html = "";

    if (job.name === "sendOtp") {
      subject = "Account verification";
      html = otpHtml(fullName, otp);
    } else if (job.name === "forgotPasswordOtp") {
      subject = "Your Password Reset OTP";
      html = forgotPasswordHtml(fullName, otp);
    } else if (job.name === "businessMail") {
      // ✅ Convert base64 strings back to Buffers
      const { data, pdf, files } = job.data;
      
      const pdfFile: Express.Multer.File = {
        ...pdf,
        buffer: Buffer.from(pdf.buffer, 'base64'), // Convert base64 back to Buffer
      };
      
      const filesList: Express.Multer.File[] = files.map((file: any) => ({
        ...file,
        buffer: Buffer.from(file.buffer, 'base64'), // Convert base64 back to Buffer
      }));
      
      // console.log({
      //   "from email worker" : {data, pdf: pdfFile, files: filesList}
      // });
      
      return businessLoanFunctions(data, pdfFile, filesList);
    } else {
      console.warn(`Unknown job name: ${job.name}`);
      return;
    }
    
    try {
      await sendEmail(email, subject, html);
      console.log(`✅ Email sent to ${email} for job: ${job.name}`);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  },
  { connection: redisClient }
);