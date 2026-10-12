import express from "express";
import { messageControllers } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/generate-url",
  fileUploader.sendFiles,
  messageControllers.generateFileUrl
);
router.get(
  "/personal-messages/:roomId",
  auth(UserRole.Admin),
  messageControllers.personalMessages
);
router.get(
  "/user/personal-messages/:clientId",
  messageControllers.personalMessagesForUser
);
router.get(
  "/all-rooms",
  auth(UserRole.Admin),
  messageControllers.getAllChatRooms
);
router.patch(
  "/mark-seen/:roomId",
  auth(UserRole.Admin),
  messageControllers.markMessagesAsSeen
);
router.patch(
  "/restrict-user/:roomId",
  auth(UserRole.Admin),
  messageControllers.restrictUser
);
router.get(
  "/check-restriction/:clientId",
  messageControllers.checkUserRestriction
);

export const messageRoute = router;
