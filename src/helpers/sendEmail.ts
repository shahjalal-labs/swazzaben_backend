import nodemailer from "nodemailer";
import {
  CreateLoanInput,
  generateLoanEmailHTML,
  rejectedText,
  selectedText,
} from "../app/modules/businessloan";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: config.emailSender.email,
    pass: config.emailSender.app_pass,
  },
});

const getSenderEmail = () => config.emailSender.email || "admin@lendmora.com";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  const mailOptions = {
    from: `"Lendmora" <${getSenderEmail()}>`,
    to,
    subject,
    html,
    text,
  };

  // ✅ return the nodemailer response
  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const sendLoanEmail = async ({
  to,
  subject,
  ownerName,
  loanSummary,
  pdfBuffer,
  loan,
  files,
}: {
  to: string;
  subject: string;
  ownerName: string;
  loanSummary: string;
  pdfBuffer: Buffer;
  loan: CreateLoanInput;
  files: Express.Multer.File[];
}) => {
  const mailOptions = {
    from: `"${ownerName}" <${getSenderEmail()}>`,
    replyTo: loan.loanUser.email, // user er email
    to, // your inbox
    subject,
    html: generateLoanEmailHTML(ownerName, loanSummary, loan),
    attachments: [ 
      {
        filename: "Application.pdf",
        content: pdfBuffer,
      },
      ...(files?.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      })) || []),
    ],
  };

  // ✅ return the nodemailer response
  const info = await transporter.sendMail(mailOptions);
  return info;
};
export const sendLoanSelectedEmail = async ({
  to,
  subject,
  name,
  message,
  address,
}: {
  to: string;
  subject: string;
  name?: string;
  message?: string;
  address?: string;
}) => {
  const mailOptions = {
    from: `"Lendmora" <${getSenderEmail()}>`,
    replyTo: getSenderEmail(),
    to, // user  
    subject,
    html: selectedText(name, message, address),
  };

  // ✅ return the nodemailer response
  const info = await transporter.sendMail(mailOptions);
  return info;
};
export const sendLoanRejectedEmail = async ({
  to,
  subject,
  name,
  message,
  address,
}: {
  to: string;
  subject: string;
  name?: string;
  message?: string;
  address?: string;
}) => {
  const mailOptions = {
    from: `"Lendmora" <${getSenderEmail()}>`,
    replyTo: getSenderEmail(),
    to, // user inbox
    subject,
    html: rejectedText(name, message, address),
  };

  // ✅ return the nodemailer response
  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const sendEmailForContact = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  const mailOptions = {
    from: `"Support" <${getSenderEmail()}>`,
    replyTo: to, // 👈 reply goes to the visitor
    to: config.emailSender.email, // 👈 always to YOU
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
