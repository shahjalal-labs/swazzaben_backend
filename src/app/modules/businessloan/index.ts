import { Loan, LoanUser } from "@prisma/client";

export interface CreateLoanInput {
  hasBussiness: boolean;
  fundingAmount: number;
  credit: string;
  useCase: string;
  hasBank: boolean;
  approvalFiles: string[];
  loanUser: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  business: {
    businessName: string;
    startMonth: string;
    startDate: string;
    startYear: string;
    annualRevenue: number;
    legalEntity: string;
    industryType: string;
    dbaName: string;
    B_phone: string;
    B_address: string;
    EIN_code: string;
    B_city: string;
    B_state: string;
    B_zipCode: string;
    businessOwner: {
      FullName: string;
      SSN: string;
      month: string;
      day: string;
      year: string;
      email: string;
      phone: string;
      ownerParcentage: string;
      address: string;
      city: string;
      state: string;
      zipcode: string;
      signature: string;
    }[];
  };
}

export const generateLoanEmailHTML = (
  ownerName: string,
  loanSummary: string,
  loan: CreateLoanInput
) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Overview</title>
    <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 8px 8px 0 0;
      text-align: center;
      font-size: 22px;
    }
    .content {
      padding: 20px;
      color: #333333;
      line-height: 1.6;
    }
    .content p {
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999999;
      margin-top: 20px;
    }
    .highlight {
      color: #4CAF50;
      font-weight: bold;
    }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">New Business Funding Application Received</div> <br/>
      <div class="content">
        <p><strong>${ownerName}</strong> has submitted a new business funding application.</p>
        <h2>Applicant Details</h2>
        <ul>
          <li><strong>Name:</strong> ${loan.loanUser.firstName} ${
    loan.loanUser.lastName
  }</li>
          <li><strong>Email:</strong> ${loan.loanUser.email}</li>
          <li><strong>Phone:</strong> ${loan.loanUser.phone}</li>
        </ul>

        <h2>Funding Details</h2>
        <ul>
          <li><strong>Funding Amount:</strong> $${loan.fundingAmount}</li>
          <li><strong>Credit:</strong> ${loan.credit}</li>
          <li><strong>Use Case:</strong> ${loan.useCase}</li>
          <li><strong>Has Bank Account:</strong> ${
            loan.hasBank ? "Yes" : "No"
          }</li>
        </ul>

        <h2>Business Information</h2>
        <ul>
          <li><strong>Business Name:</strong> ${loan.business.businessName}</li>
          <li><strong>DBA Name:</strong> ${loan.business.dbaName}</li>
          <li><strong>Industry:</strong> ${loan.business.industryType}</li>
          <li><strong>Start Date:</strong> ${loan.business.startMonth}/${
    loan.business.startDate
  }/${loan.business.startYear}</li>
          <li><strong>Annual Revenue:</strong> $${
            loan.business.annualRevenue
          }</li>
          <li><strong>Phone:</strong> ${loan.business.B_phone}</li>
          <li><strong>Address:</strong> ${loan.business.B_address}, ${
    loan.business.B_city
  }, ${loan.business.B_state} - ${loan.business.B_zipCode}</li>
          <li><strong>EIN:</strong> ${loan.business.EIN_code}</li>
        </ul>

        <h2>Business Owners</h2>
        <ul>
          ${loan.business.businessOwner
            .map(
              (o, i) => `
            <li>
              <strong>Owner ${i + 1}:</strong> ${o.FullName} (${
                o.ownerParcentage
              }%)<br>
              Email: ${o.email} | Phone: ${o.phone}<br>
              DOB: ${o.month}/${o.day}/${o.year}<br>
              SSN: ${o.SSN}<br>
              Address: ${o.address}, ${o.city}, ${o.state}, ${o.zipcode}
            </li>
          `
            )
            .join("")}
        </ul>

        <p>You can also download the attached <strong>Overview PDF</strong> for records.</p>
      </div>
      <div class="footer">
        &copy; 2025 lendmora.com. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const loanGetterHTML = (loan: Loan, loanUser: LoanUser) => {
  return ` 
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loan Request Received</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 8px 8px 0 0;
      text-align: center;
      font-size: 22px;
    }
    .content {
      padding: 20px;
      color: #333333;
      line-height: 1.6;
    }
    .content p {
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999999;
      margin-top: 20px;
    }
    .highlight {
      color: #4CAF50;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Your Business Funding Request Received</div>
    <div class="content">
      <p>Hi <span class="highlight">${loanUser.firstName} ${
    loanUser.lastName
  }</span>,</p>
      <p>Thank you for submitting your business funding request. Here are the details we received:</p>
      <ul>
        <li><strong>Business Ownership:</strong> ${
          loan.hasBussiness ? "Yes" : "No"
        }</li>
        <li><strong>Funding Amount:</strong> $${loan.fundingAmount}</li>
        <li><strong>Credit Score:</strong> ${loan.credit}</li>
        <li><strong>Use Case:</strong> ${loan.useCase}</li>
        <li><strong>Bank Account Available:</strong> ${
          loan.hasBank ? "Yes" : "No"
        }</li>
      </ul>
      <h3>What Happens Next?</h3>
      <p>
        Our loan specialists will review your request within the next 2–3 business days.  
        You may receive a call or email if we need more information or documents.  
        Once approved, you will receive further instructions on how to proceed.
      </p>

      <h3>Need Assistance?</h3>
      <p>
        If you have any questions, please contact our support team at  
        <a href="mailto:admin@lendmora.com">admin@lendmora.com</a>.
      </p>

      <p>Best regards,<br>Admin@lendmora.com</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} <a href="https://lendmora.com">lendmora.com</a>. All rights reserved. <br>
      1234 Business Road, Suite 100, New York, NY
    </div>
  </div>
</body>
</html>
`;
};

export const emailText = (loanUser: LoanUser, loan: Loan) => {
  return `
Hi ${loanUser.firstName} ${loanUser.lastName},

Thank you for submitting your business funding request. Here are the details we received:

- Business Ownership: ${loan.hasBussiness ? "Yes" : "No"}
- Funding Amount: $${loan.fundingAmount}
- Credit Score: ${loan.credit}
- Use Case: ${loan.useCase}
- Bank Account Available: ${loan.hasBank ? "Yes" : "No"}

We will review your request and get back to you shortly.

Best regards,
Your Loan Team
`;
};

const defultSelectedMessage = `We are thrilled to inform you that your business funding application has been approved! Congratulations on reaching this milestone. We understand the importance of this funding for your business growth, and we are excited to support you on this journey.`;
export const selectedText = (
  name?: string,
  message?: string,
  address?: string
) => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Approved</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 40px;
    }
    .container {
      background-color: #fff;
      max-width: 700px;
      margin: auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .header {
      background-color: rgb(41, 166, 100);
      color: #fff;
      text-align: center;
      padding: 20px;
      font-size: 20px;
      font-weight: bold;
    }
    .body {
      padding: 30px;
      color: #333;
      line-height: 1.6;
    }
    .body a { color: #1db954; text-decoration: none; }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #777;
      padding: 20px;
      background-color: #f4f4f4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      Congratulations! <br />
      Your Business Funding Application Has Been Approved
    </div>

    <div class="body">
      <p>Hi, <strong>${name ? name : "Dear User"}</strong></p>

      <p>${message ? message : defultSelectedMessage}</p>

      <p><strong>Need Help?</strong><br>
      If you have any questions or need assistance at any stage, feel free to reach out to us.
      We're here to help! Simply email us at admin@lendmora.com, and we'll be happy to support you.</p>
      <p>We're excited to partner with you and help your business grow.
      Thank you for choosing LendMora.</p>

      <p>Best regards,<br>
      <strong>admin@lendmora.com</strong></p>
    </div>

    <div class="footer">
      ©2025 LendMora. All rights reserved.<br />
      ${address ? address : "1234 Business Road, Suite 100, New York, NY"} 
    </div>
  </div>
</body>
</html>
  `;
};

const defultRejectedMessage = `Thank you for submitting your business funding request. Unfortunately, after reviewing your application, we regret to inform you that it has not been approved. We understand that this news may be disappointing, and we want to assure you that this decision was made after careful consideration of various factors.`;

export const rejectedText = (
  name?: string,
  message?: string,
  address?: string
) => {
  {
    return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Rejected</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 40px;
    }
    .container {
      background-color: #fff;
      max-width: 700px;
      margin: auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .header {
      background-color: rgb(255, 77, 79);
      color: #fff;
      text-align: center;
      padding: 20px;
      font-size: 20px;
      font-weight: bold;
    }
    .body {
      padding: 30px;
      color: #333;
      line-height: 1.6;
    }
    .body a { color: #e53935; text-decoration: none; }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #777;
      padding: 20px;
      background-color: #f4f4f4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      Rejected Application <br />
      Your Business Funding Application Has Been Rejected
    </div>

    <div class="body">
      <p>Hi, <strong>${name ? name : "Dear User"}</strong></p>

      <p>${message ? message : defultRejectedMessage}</p>

      <p><strong>Next Steps:</strong><br>
      You may be eligible to apply again in the future. Please feel free to 
      reach out if you need any guidance or assistance.</p>

      <p>Thank you again for considering <strong>LendMora</strong>.  
      We wish you success in your future endeavors.</p>

      <p>Best regards,<br>
      <strong>admin@lendmora.com</strong></p>
    </div>

    <div class="footer">
      ©2025 LendMora. All rights reserved.<br />
      ${address ? address : "1234 Business Road, Suite 100, New York, NY"} 
    </div>
  </div>
</body>
</html>
`;
  }
};

