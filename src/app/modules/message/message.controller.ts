import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { messageService } from "./message.service";

const generateFileUrl = catchAsync(async (req, res) => {
  const fileUrl = await messageService.urlGenerate(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File URL generated successfully",
    data: fileUrl,
  });
});

const personalMessages = catchAsync(async (req, res) => {
  const messages = await messageService.personalMessages(req);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Personal Messages retrived successfully",
    data: messages,
  });
});
const personalMessagesForUser = catchAsync(async (req, res) => {
  const messages = await messageService.personalMessagesForUser(req);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Personal Messages (For User) retrived successfully",
    data: messages,
  });
});

const getAllChatRooms = catchAsync(async (req, res) => {
  const rooms = await messageService.getAllChatRooms();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All chat rooms retrieved successfully",
    data: rooms,
  });
});

const markMessagesAsSeen = catchAsync(async (req, res) => {
  const result = await messageService.markMessagesAsSeen(req.params.roomId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Messages marked as seen",
    data: result,
  });
});

const restrictUser = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const { isRestricted } = req.body;
  
  const result = await messageService.restrictUser(roomId, isRestricted);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: result,
  });
});

const checkUserRestriction = catchAsync(async (req, res) => {
  const { clientId } = req.params;
  
  const result = await messageService.checkUserRestriction(clientId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User restriction status retrieved",
    data: result,
  });
});

export const messageControllers = {
  generateFileUrl,
  personalMessages,
  personalMessagesForUser,
  getAllChatRooms,
  markMessagesAsSeen,
  restrictUser,
  checkUserRestriction,
};
