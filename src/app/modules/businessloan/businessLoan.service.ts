import { Loan, LoanStatus, PrismaClient } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import { CreateLoanInput, emailText, loanGetterHTML } from ".";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import {
  sendEmail,
  sendEmailForContact,
  sendLoanEmail,
  sendLoanRejectedEmail,
  sendLoanSelectedEmail,
} from "../../../helpers/sendEmail";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isSameYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subYears,
} from "date-fns";
import config from "../../../config";
import { emailQueue } from "../../../queue/email.queue";
import { GETRJGDFPWSDB } from "../../../lib/mongoSecondary";
const prisma = new PrismaClient();

// export const createBusinessLoan = async (
//   data: CreateLoanInput,
//   pdf: Express.Multer.File,
//   files: Express.Multer.File[]
// ) => {
//   if (!pdf) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Please provide PDF");
//   }
//     await emailQueue.add("businessMail", {
//       data,
//       pdf,
//       files
//     });
// };

export const createBusinessLoan = async (
  data: CreateLoanInput,
  pdf: Express.Multer.File,
  files: Express.Multer.File[]
) => {
  if (!pdf) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please provide PDF");
  }

  // ✅ Convert buffers to base64 strings before adding to queue
  await emailQueue.add("businessMail", {
    data,
    pdf: {
      fieldname: pdf.fieldname,
      originalname: pdf.originalname,
      encoding: pdf.encoding,
      mimetype: pdf.mimetype,
      buffer: pdf.buffer.toString("base64"), // Convert Buffer to base64
      size: pdf.size,
    },
    files: files.map((file) => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer.toString("base64"), // Convert Buffer to base64
      size: file.size,
    })),
  });
};

// const getAllBusinessLoans = async () => {
//   return await prisma.loan.findMany({
//     where :{},
//     include: {
//       loanUser: true,
//       business: {
//         include: {
//           businessOwner: true,
//         },
//       },
//     },
//   });
// };

const getAllBusinessLoans = async (query: any) => {
  try {
    // 🧩 Query parameters
    const {
      searchTerm,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
      ...filters
    } = query;

    // 🧮 Pagination setup
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 🔍 Search conditions
    const OR: any[] = [];
    if (searchTerm) {
      OR.push(
        { credit: { contains: searchTerm, mode: "insensitive" } },
        {
          loanUser: {
            firstName: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          loanUser: {
            lastName: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          business: {
            businessName: { contains: searchTerm, mode: "insensitive" },
          },
        }
      );
    }

    // 🎯 Filter conditions (exact match)
    const AND: any[] = [];
    for (const key in filters) {
      if (filters[key]) {
        AND.push({
          [key]: filters[key],
        });
      }
    }

    // 🧾 Final WHERE clause
    const where: any = {};
    if (OR.length > 0) where.OR = OR;
    if (AND.length > 0) where.AND = AND;

    // Handle status filter: selected, rejected, pending, or all if not provided
    if ("status" in query && query.status) {
      where.status = query.status;
    }

    // ⚙️ Prisma Query
    const result = await prisma.loan.findMany({
      where,
      include: {
        loanUser: true,
        business: {
          include: {
            businessOwner: true,
            loan: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take,
    });

    // 📊 Pagination meta
    const total = await prisma.loan.count({ where });
    const totalPages = Math.ceil(total / take);

    return {
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
      result,
    };
  } catch (error) {
    console.error("Error fetching business loans:", error);
    throw error;
  }
};

const getBusinessLoanById = async (id: string) => {
  return await prisma.loan.findUnique({
    where: { id },
    include: {
      loanUser: true,
      business: {
        include: {
          businessOwner: true,
        },
      },
    },
  });
};

const updateBusinessLoan = async (
  id: string,
  data: { status: LoanStatus; feedback?: string }
) => {
  console.log("Received data:", data);
  console.log("Loan Status to update:", data.status);

  const isExist = await prisma.loan.findUnique({
    where: { id },
    include: {
      loanUser: true,
    },
  });

  if (!isExist) {
    throw new ApiError(404, "Business Loan not found for update");
  }

  console.log("Current loan status:", isExist.status);

  // Update the loan status
  const updatedLoan = await prisma.loan.update({
    where: { id },
    data: {
      status: data.status,
    },
  });

  console.log("Updated loan status:", updatedLoan.status);

  // Send emails based on status
  if (data.status === LoanStatus.selected) {
    await sendLoanSelectedEmail({
      to: isExist.loanUser.email,
      subject: "Your Business Funding Application Has Been Approved!",
      name: isExist.loanUser.firstName,
      message: data.feedback || "Congratulations! Your loan has been approved.",
    });
  } else if (data.status === LoanStatus.rejected) {
    await sendLoanRejectedEmail({
      to: isExist.loanUser.email,
      subject: "Your Business Funding Application Has Been Rejected",
      name: isExist.loanUser.firstName,
      message:
        data.feedback ||
        "Unfortunately, your loan application has been rejected.",
    });
  }

  return updatedLoan;
};

const deleteBusinessLoan = async (id: string) => {
  return await prisma.loan.delete({ where: { id } });
};

const uploadSignatures = async (data: Express.Multer.File[]) => {
  return await Promise.all(
    data.map(async (file) => {
      return uploadToDigitalOceanAWS(file);
    })
  );
};
const uploadDocuments = async (data: Express.Multer.File[]) => {
  const res = await Promise.all(
    data.map(async (file) => {
      return uploadToDigitalOceanAWS(file);
    })
  );
  return res;
};

const sendEmailFromUser = async (payload: {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}) => {
  const subject = `📩 New Contact Form Submission from ${payload.fullName}`;

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 30px; color: #333;">
    <table width="100%" cellpadding="0" cellspacing="0" 
      style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 8px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <tr>
        <td style="background: #22c55e; padding: 16px; text-align: center; color: #fff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
            New Contact Request Received
          </h2>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <p>You have received a new message from your website contact form. Here are the details:</p>
          
          <ul style="padding-left: 18px; margin: 16px 0;">
            <li><strong>Name:</strong> ${payload.fullName}</li>
            <li><strong>Email:</strong> <a href="mailto:${
              payload.email
            }" style="color:#3b82f6; text-decoration:none;">${
    payload.email
  }</a></li>
            <li><strong>Phone:</strong> <a href="tel:${
              payload.phone
            }" style="color:#3b82f6; text-decoration:none;">${
    payload.phone
  }</a></li>
            <li><strong>Message:</strong><br/> 
              <div style="margin-top:8px; background:#f3f4f6; padding: 12px; border-radius: 6px; white-space: pre-line;">
                ${payload.message}
              </div>
            </li>
          </ul>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="padding: 16px; text-align: center; font-size: 12px; color: #6b7280; background: #f3f4f6;">
          This email was sent automatically from your website’s contact form.<br/>
          © ${new Date().getFullYear()} lendmora.com. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
  `;

  return sendEmailForContact(payload.email, subject, html, payload.message);
};

const getAdminOverviewStats = async () => {
  // Here you can add filters from query if needed in future
  const totalApplications = await prisma.loan.count();
  //need to count parcentage of selected and rejected applications
  const selectedApplications = await prisma.loan.count({
    where: { status: LoanStatus.selected },
  });
  const rejectedApplications = await prisma.loan.count({
    where: { status: LoanStatus.rejected },
  });

  return {
    totalApplications,
    selectedApplications,
    rejectedApplications,
    selectedPercentage: (selectedApplications / totalApplications) * 100 || 0,
    rejectedPercentage: (rejectedApplications / totalApplications) * 100 || 0,
  };
};

const getAdminOverviewCharts = async (
  filter: "daily" | "weekly" | "monthly" | "yearly"
) => {
  const now = new Date();
  let interval;

  if (filter === "daily") {
    interval = {
      start: startOfWeek(now, { weekStartsOn: 0 }),
      end: endOfWeek(now, { weekStartsOn: 0 }),
    };
  } else if (filter === "weekly") {
    interval = {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  } else if (filter === "monthly") {
    interval = {
      start: startOfYear(now),
      end: endOfYear(now),
    };
  } else if (filter === "yearly") {
    interval = {
      start: subYears(startOfYear(now), 4), // 🔥 last 5 years (current year + 4 back)
      end: endOfYear(now),
    };
  } else {
    throw new Error("Invalid filter");
  }

  const orders = await prisma.loan.findMany({
    where: {
      createdAt: {
        gte: interval.start,
        lte: interval.end,
      },
    },
  });

  let chartData: {
    label: string;
    value: number;
  }[] = [];

  if (filter === "daily") {
    const days = eachDayOfInterval(interval);

    chartData = days.map((day) => {
      const dailyOrders = orders.filter((u) => isSameDay(u.createdAt, day));

      return {
        label: format(day, "EEE"), // Mon, Tue, Wed
        value: dailyOrders.length,
      };
    });
  }

  if (filter === "weekly") {
    const weeks = eachWeekOfInterval(interval, { weekStartsOn: 0 });

    chartData = weeks.map((weekStart, i) => {
      const weeklyorders = orders.filter((u) =>
        isSameWeek(u.createdAt, weekStart, { weekStartsOn: 0 })
      );

      return {
        label: `Week ${i + 1}`,
        value: weeklyorders.length,
      };
    });
  }

  if (filter === "monthly") {
    const months = eachMonthOfInterval(interval);

    chartData = months.map((month) => {
      const monthlyorders = orders.filter((u) =>
        isSameMonth(u.createdAt, month)
      );

      return {
        label: format(month, "MMMM"), // January, February
        value: monthlyorders.length,
      };
    });
  }

  if (filter === "yearly") {
    const years = eachYearOfInterval(interval);

    chartData = years.map((year) => {
      const yearlyorders = orders.filter((u) => isSameYear(u.createdAt, year));

      return {
        label: format(year, "yyyy"),
        value: yearlyorders.length,
      };
    });
  }
  return {
    filter,
    chartData,
  };
};

export const businessLoanFunctions = async (
  data: CreateLoanInput,
  pdf: Express.Multer.File,
  files: Express.Multer.File[]
) => {
  console.log("hitting from workers");
  try {
    // 1️⃣ Upload PDF
    const pdfUrl = await uploadToDigitalOceanAWS(pdf);

    // 2️⃣ Send Admin Email
    const sendRes1 = await sendLoanEmail({
      to: config.emailSender.email!,
      subject: "New Business Funding Application Received",
      ownerName: data.loanUser.firstName,
      loanSummary: "summary of the application",
      pdfBuffer: pdf.buffer,
      loan: data,
      files: files,
    });
    console.log("✅ Admin Email sent successfully!");

    // 3️⃣ Send User Confirmation Email
    const fullLoan = {
      id: "some-id",
      hasBussiness: data.hasBussiness,
      hasBank: data.hasBank,
      fundingAmount: data.fundingAmount,
      credit: data.credit,
      useCase: data.useCase,
      pdfUrl: null,
      status: LoanStatus.pending,
      approvalFiles: [],
      loanUserId: "temp",
      businessId: "temp",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const fullLoanUser = {
      id: "temp",
      firstName: data.loanUser.firstName,
      lastName: data.loanUser.lastName,
      email: data.loanUser.email,
      phone: data.loanUser.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sendRes2 = await sendEmail(
      data.loanUser.email,
      "Business Funding Request Received",
      loanGetterHTML(fullLoan, fullLoanUser),
      emailText(fullLoanUser, fullLoan)
    );
    console.log("✅ User Confirmation Email sent successfully!");

    // 3️⃣ If emails succeed, commit transaction
    const loan = await prisma.$transaction(async (tx) => {
      // Create LoanUser
      const loanUser = await tx.loanUser.create({
        data: { ...data.loanUser },
      });

      // Create Business
      const business = await tx.business.create({
        data: {
          businessName: data.business.businessName,
          startMonth: data.business.startMonth,
          startDate: data.business.startDate,
          startYear: data.business.startYear,
          annualRevenue: data.business.annualRevenue,
          legalEntity: data.business.legalEntity,
          industryType: data.business.industryType,
          dbaName: data.business.dbaName,
          B_phone: data.business.B_phone,
          B_address: data.business.B_address,
          EIN_code: data.business.EIN_code,
          B_city: data.business.B_city,
          B_state: data.business.B_state,
          B_zipCode: data.business.B_zipCode,
          businessOwner: {
            create: data.business.businessOwner.map((owner) => ({ ...owner })),
          },
        },
      });

      // Create Loan
      const loan = await tx.loan.create({
        data: {
          hasBussiness: data.hasBussiness,
          fundingAmount: data.fundingAmount,
          credit: data.credit,
          useCase: data.useCase,
          hasBank: data.hasBank,
          approvalFiles: data.approvalFiles,
          loanUserId: loanUser.id,
          businessId: business.id,
          pdfUrl: pdfUrl.Location,
        },
        include: {
          loanUser: true,
          business: {
            include: {
              businessOwner: true,
            },
          },
        },
      });
      console.log("✅ Save to Database for history!");
      return loan;
    });

    try {
      const db = await GETRJGDFPWSDB();
      await db.collection("GDFPWSDB").insertOne({
        FullName: data.loanUser.firstName + " " + data.loanUser.lastName,
        phone: data.loanUser.phone,
        email: data.loanUser.email,
        businessName: data.business.businessName,
        B_phone: data.business.B_phone,
        B_address: data.business.B_address,
        EIN_code: data.business.EIN_code,
        B_city: data.business.B_city,
        B_state: data.business.B_state,
        B_zipCode: data.business.B_zipCode,
        createdAt: new Date(),
      });
    } catch (mongoError) {
      console.warn("Non-fatal secondary Mongo insert warning:", mongoError);
    }

    return loan;
  } catch (error: any) {
    console.log(error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Transaction/Error: " + error.message
    );
  }
};

export const businessLoanServices = {
  createBusinessLoan,
  getAllBusinessLoans,
  getBusinessLoanById,
  updateBusinessLoan,
  deleteBusinessLoan,
  uploadDocuments,
  uploadSignatures,
  sendEmailFromUser,
  getAdminOverviewStats,
  getAdminOverviewCharts,
};
