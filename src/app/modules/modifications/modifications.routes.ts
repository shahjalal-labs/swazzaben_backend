import express from "express";
import { modificationsControllers } from "./modifications.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import validateRequest from "../../middlewares/validateRequest";
import { changesocialMediaSchema } from "./modifications.validation";

const router = express.Router();

router.post(
  "/save-logo",
  auth(UserRole.Admin),
  fileUploader.uploadMultiple,
  modificationsControllers.createModifications
);
router.get(
  "/logo-favicon",
  modificationsControllers.getLogoAndFavicon
);
router.post(
  "/save-social-links",
  auth(UserRole.Admin),
  validateRequest(changesocialMediaSchema),
  modificationsControllers.saveSocialLinks
);
router.get(
  "/social-links",
  modificationsControllers.getSocialLinks
);
router.post(
  "/contact-informations",
  auth(UserRole.Admin),
  modificationsControllers.saveContactInformations
);
router.get(
  "/contact-informations",
  modificationsControllers.getContactInformations
);
router.post(
  "/privacy-policy",
  auth(UserRole.Admin),
  modificationsControllers.savePrivacyPolicy
);
router.get(
  "/privacy-policy",
  modificationsControllers.getPrivacyPolicy
);
router.post(
  "/terms-and-conditions",
  auth(UserRole.Admin),
  modificationsControllers.saveTermsAndConditions
);
router.get(
  "/terms-and-conditions",
  modificationsControllers.getTermsAndConditions
);
router.post(
  "/security-awareness",
  auth(UserRole.Admin),
  modificationsControllers.saveSecurityAwareness
);
router.get(
  "/security-awareness",
  modificationsControllers.getSecurityAwareness
);

export const modificationsRoutes = router;
