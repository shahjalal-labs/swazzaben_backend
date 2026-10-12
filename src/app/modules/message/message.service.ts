import { Request } from "express";
import { paginationHelper } from "../../../shared/pagination";
import prisma from "../../../shared/prisma";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";

const urlGenerate = async (req: Request) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const processImages = await Promise.all(
    Object.values(files).flat().map(async (file) => {
      const uploadResult = await uploadToDigitalOceanAWS(file);
      return uploadResult.Location;
    })
  );
  
  const urls = await Promise.all(processImages);
  return urls;
};

const personalMessages = async (req: Request) => {
  const { roomId } = req.params;
  const { page, limit, skip } = paginationHelper(req.query as any);

  const messages = await prisma.message.findMany({
    where: {
      roomId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });

  const messageCount = await prisma.message.count({
    where: {
      roomId,
    },
  });

  const totalPages = Math.ceil(messageCount / limit);

  return {
    messageCount,
    currentPage: page,
    totalPages,
    messages,
  };
};
const personalMessagesForUser = async (req: Request) => {
  const { clientId } = req.params;
  const { page, limit, skip } = paginationHelper(req.query as any);

  const room = await prisma.chatRoom.findFirst({
    where: {
      clientId
    },
  });

  if (!room) {
    return {
      messageCount: 0,
      currentPage: page,
      totalPages: 0,
      messages: "there is no messages for this user.",
    };
  }

  const messages = await prisma.message.findMany({
    where: {
        roomId : room.id,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });

  const messageCount = await prisma.message.count({
    where: {
      roomId: room.id,
    },
  });

  const totalPages = Math.ceil(messageCount / limit);

  return {
    messageCount,
    currentPage: page,
    totalPages,
    messages,
  };
};

const getAllChatRooms = async () => {
  const rooms = await prisma.chatRoom.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Get only the last message
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get unseen message counts for each room
  const roomsWithUnseenCount = await Promise.all(
    rooms.map(async (room) => {
      // Count messages from client that admin hasn't seen
      const unseenCount = await prisma.message.count({
        where: {
          roomId: room.id,
          senderType: "client", // Messages from client
          seenByAdmin: false, // Not seen by admin yet
        },
      });

      return {
        id: room.id,
        clientId: room.clientId,
        adminId: room.adminId,
        lastMessage: room.messages[0] || null,
        unseenCount,
        isRestricted: room.isRestricted,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };
    })
  );

  return roomsWithUnseenCount;
};

const markMessagesAsSeen = async (roomId: string) => {
  await prisma.message.updateMany({
    where: {
      roomId,
      senderType: "client",
      seenByAdmin: false,
    },
    data: {
      seenByAdmin: true,
    },
  });

  return { success: true };
};

const restrictUser = async (roomId: string, isRestricted: boolean) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new Error("Chat room not found");
  }

  const updatedRoom = await prisma.chatRoom.update({
    where: { id: roomId },
    data: { isRestricted },
  });

  return {
    success: true,
    message: isRestricted ? "User restricted successfully" : "User unrestricted successfully",
    room: updatedRoom,
  };
};

const checkUserRestriction = async (clientId: string) => {
  const room = await prisma.chatRoom.findFirst({
    where: { clientId },
  });

  if (!room) {
    return { isRestricted: false };
  }

  return { isRestricted: room.isRestricted };
};

export const messageService = {
  urlGenerate,
  personalMessages,
  personalMessagesForUser,
  getAllChatRooms,
  markMessagesAsSeen,
  restrictUser,
  checkUserRestriction,
};
