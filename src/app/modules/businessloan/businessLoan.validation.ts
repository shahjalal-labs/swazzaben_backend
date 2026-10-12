import { LoanStatus } from "@prisma/client";
import { z } from "zod";

export const LoanSchemaValidation = z.object({
  // Loan fields
  hasBussiness: z.boolean(),
  fundingAmount: z.number(),
  credit: z.string(),
  useCase: z.string(),
  hasBank: z.boolean(),
  // LoanUser nested
  loanUser: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  // Business nested
  business: z.object({
    businessName: z.string(),
    startMonth: z.string(),
    startDate: z.string(),
    startYear: z.string(),
    annualRevenue: z.number(),
    legalEntity: z.string(),
    industryType: z.string(),
    dbaName: z.string(),
    B_phone: z.string(),
    B_address: z.string(),
    EIN_code: z.string(),
    B_city: z.string(),
    B_state: z.string(),
    B_zipCode: z.string(),
    // BusinessOwner array
    businessOwner: z
      .array(
        z.object({
          FullName: z.string(),
          SSN: z.string(),
          month: z.string(),
          day: z.string(),
          year: z.string(),
          email: z.string().email(),
          phone: z.string(),
          ownerParcentage: z.string(),
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipcode: z.string(),
          signature: z.string().url(),
        })
      )
      .min(1, "At least one business owner is required"),
  }),
});

export const sendMailValidation = z.object({
  fullName: z.string({ required_error: "fullName is required !" }),
  email: z.string({ required_error: "email is required !" }).email(),
  phone: z.string({ required_error: "phone is required !" }),
  message: z.string({ required_error: "message is required !" }),
});

export const updateApplicationValidation = z.object({
  status: z.enum([LoanStatus.selected, LoanStatus.rejected], {
    required_error:"Please provide the selected or rejected Value- status ?",
  }),
  feedback: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long!" })
    .max(1000, { message: "Feedback must be at most 1000 characters long!" })
    .optional(),
});