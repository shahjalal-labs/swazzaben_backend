import { Request, Response } from "express";
import { businessLoanServices } from "./businessLoan.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createBusinessLoan = catchAsync(async (req: Request, res: Response) => {
const files = req.files as {
  overviewPdf: Express.Multer.File[];
  approvalFiles: Express.Multer.File[];
};
const overviewPdf = files.overviewPdf?.[0];
const approvalFiles = files.approvalFiles || []; 
  const result = await businessLoanServices.createBusinessLoan(
    req.body,
    overviewPdf,
    approvalFiles
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The businessLoan has been created successfully",
    data: result,
  });
});

const getAllBusinessLoans = catchAsync(async (_req: Request, res: Response) => {
  const result = await businessLoanServices.getAllBusinessLoans(_req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All businessLoans has been retrived successfully",
    data: result,
  });
});

const getBusinessLoanById = catchAsync(async (req: Request, res: Response) => {
  const result = await businessLoanServices.getBusinessLoanById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "businessLoan has been retrived successfully",
    data: result,
  });
});

const updateBusinessLoan = catchAsync(async (req: Request, res: Response) => {
  const result = await businessLoanServices.updateBusinessLoan(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "businessLoan has been updated successfully",
    data: result,
  });
});

const deleteBusinessLoan = catchAsync(async (req: Request, res: Response) => {
  await businessLoanServices.deleteBusinessLoan(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "businessLoan has been deleted successfully",
  });
});

//-------------------  Uploads ---------------------//
const uploadSignatures = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    ownersSig?: Express.Multer.File[];
    approvalFiles?: Express.Multer.File[];
  };

  const ownersSig = files.ownersSig ?? [];
  if (ownersSig.length === 0) {
    throw new Error("Approval files are required");
  }

  const result = await businessLoanServices.uploadSignatures(ownersSig);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Signature uploaded successfully",
    data: result,
  });
});

const uploadDocuments = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    ownersSig?: Express.Multer.File[];
    approvalFiles?: Express.Multer.File[];
  };

  const approvalFiles = files.approvalFiles ?? [];
  if (approvalFiles.length === 0) {
    throw new Error("Approval files are required");
  }

  const result = await businessLoanServices.uploadDocuments(approvalFiles);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Documents uploaded successfully",
    data: result,
  });
});

const sendEmailFromUser = catchAsync(async (req: Request, res: Response) => {
  await businessLoanServices.sendEmailFromUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Email has been send successfully",
  });
});

const getAdminOverviewStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await businessLoanServices.getAdminOverviewStats();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin overview stats retrieved successfully",
    data: result,
  });
});
const getAdminOverviewCharts = catchAsync(async (_req: Request, res: Response) => {
  const filter = _req.query.filter as "daily" | "weekly" | "monthly" | "yearly";
  const result = await businessLoanServices.getAdminOverviewCharts(filter);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin overview charts retrieved successfully",  
    data: result,
  });
});

export const businessLoanControllers = {
  createBusinessLoan,
  getAllBusinessLoans,
  getBusinessLoanById,
  updateBusinessLoan,
  deleteBusinessLoan,
  uploadSignatures,
  uploadDocuments,
  sendEmailFromUser,
  getAdminOverviewStats,
  getAdminOverviewCharts
};
