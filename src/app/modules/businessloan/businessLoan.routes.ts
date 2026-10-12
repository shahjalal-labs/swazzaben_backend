import express from "express";
import { businessLoanControllers } from "./businessLoan.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import validateRequest from "../../middlewares/validateRequest";
import {
  LoanSchemaValidation,
  sendMailValidation,
  updateApplicationValidation,
} from "./businessLoan.validation";
import { parseBodyData } from "../../middlewares/parseBodyData";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/",
  fileUploader.uploadMultipleMainApi,
  parseBodyData,
  validateRequest(LoanSchemaValidation),
  businessLoanControllers.createBusinessLoan
);
router.post(
  "/upload-documents",
  fileUploader.uploadMultiple,
  businessLoanControllers.uploadDocuments
);
router.post(
  "/upload-signatures",
  fileUploader.uploadMultiple,
  businessLoanControllers.uploadSignatures
);
router.get("/", auth(UserRole.Admin), businessLoanControllers.getAllBusinessLoans);
router.get("/:id", auth(UserRole.Admin), businessLoanControllers.getBusinessLoanById);
router.patch("/:id",  auth(UserRole.Admin), validateRequest(updateApplicationValidation), businessLoanControllers.updateBusinessLoan);
router.delete("/:id", auth(UserRole.Admin), businessLoanControllers.deleteBusinessLoan);
router.post(
  "/send-email",
  validateRequest(sendMailValidation),
  businessLoanControllers.sendEmailFromUser
);
router.get("/admin-overview/stats", auth(UserRole.Admin), businessLoanControllers.getAdminOverviewStats);
router.get("/admin-overview/charts", auth(UserRole.Admin), businessLoanControllers.getAdminOverviewCharts);

export const businessLoanRoutes = router;