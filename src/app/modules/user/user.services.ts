import { PendingUser, Prisma, User, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import bcrypt from "bcryptjs";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";

import { paginationHelper } from "../../../shared/pagination";
import { uploadInSpace } from "../../../shared/UploadHelper";
import { sendEmail } from "../../../helpers/sendEmail";

const createPendingUserIntoDB = async (payload: PendingUser) => {
  const existingUser = await prisma.user.findFirst({
    where: { email: payload.email },
  });
  if (existingUser) {
    throw new ApiError(409, "Email already exists!");
  }

  const hashedPassword = await bcrypt.hash(payload.password as string, 10);
  const otp = generateOTP(); // 4-digit OTP
  // let otp ; // 4-digit OTP

  const OTP_EXPIRATION_TIME = 5 * 60 * 1000;
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  const subject = "Your Account Verification OTP";
  const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Account Verification Request</h2>
    <p>Hi <b>${payload.userName}</b>,</p>
    <p>Your OTP for account verification is:</p>
    <h1 style="color: #007BFF;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Thanks, <br>The Support Team</p>
  </div>
`;

  await sendEmail(payload.email, subject, html);
  await prisma.pendingUser.upsert({
    where: {
      email: payload.email,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: {
      userName: payload.userName,
      email: payload.email,
      role: payload.role,
      password: hashedPassword,
      otpCode: otp,
      expiresAt: new Date(expiresAt),
    },
  });

  return otp;
};

const resendVerifyOTP = async (email: string) => {
  const existingUser = await prisma.pendingUser.findUnique({
    where: { email: email },
  });
  if (!existingUser) {
    throw new ApiError(409, "User not found!");
  }

  const otp = generateOTP();
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000;
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  const subject = "Your Account Verification OTP";
  const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Account Verification Request</h2>
    <p>Hi <b>${existingUser.userName}</b>,</p>
    <p>Your OTP for account verification is:</p>
    <h1 style="color: #007BFF;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Thanks, <br>The Support Team</p>
  </div>
`;

  await sendEmail(email, subject, html);
  await prisma.pendingUser.update({
    where: {
      email: email,
    },
    data: {
      otpCode: otp,
      expiresAt: new Date(expiresAt),
    },
  });

  return otp;
};

const createUserIntoDB = async (email: string, otp: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });
  if (existingUser) {
    throw new ApiError(409, "User Already exists!");
  }

  const userPending = await prisma.pendingUser.findUnique({
    where: { email: email },
  });
  if (!userPending) {
    throw new ApiError(409, "User doesn't exist!");
  }

  const { otpCode, expiresAt, userName } = userPending;

  if (otp !== otpCode) {
    throw new ApiError(401, "Invalid OTP.");
  }

  if (Date.now() > expiresAt.getTime()) {
    await prisma.pendingUser.delete({
      where: {
        email: userPending.email,
      },
    }); // OTP has expired
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  // OTP is valid
  await prisma.pendingUser.delete({
    where: {
      email: email,
    },
  });


  const user = await prisma.user.create({
    data: {
      email: email,
      password: userPending.password,
      userName: userName,
      role: userPending.role as UserRole,
      status: "Active",
    },
  });
  // access token
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );
  return {
    accessToken,
    id: user.id,
    role: user.role,
  };
};

const socialLoginIntoDB = async (payload: {
  userName: string;
  email: string;
  role: string;
}) => {
  let user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  const password = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        userName: payload.userName,
        email: payload.email,
        password: hashedPassword,
        role: payload.role as UserRole,
      },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { accessToken, id: user.id, role: user.role };
};

const getSingleUserIntoDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found for delete");
  }

  await prisma.user.update({
    where: { id },
    data: {
      status: "Deleted",
    },
  });

  return;
};

const getUsers = async (query: any) => {
  const { search } = query;
  const whereClause: Prisma.UserWhereInput = search
    ? {
        userName: {
          contains: search,
          mode: "insensitive" as const, // <-- cast as const here
        },
      }
    : {};

  const { page, limit, skip } = paginationHelper(query);
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      userName: true,
      profileImage: true,
    },
    take: limit,
    skip,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = await prisma.user.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalCount / limit);

  return { totalCount, totalPages, currentPage: page, users };
};


const updateUser = async (
  payload: User,
  userId: string,
  file: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "user not found for edit user");
  }

  let profileImage;

  if (file) {
    profileImage = await uploadInSpace(file, "users/profileImage");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      profileImage: file ? profileImage : user.profileImage,
    },
  });

  return;
};

const deleteMyAccount = async (userId: string) => {
  const existingUser = await getSingleUserIntoDB(userId);
  if (!existingUser) {
    throw new ApiError(404, "user not found for delete this");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "Deleted",
    },
  });
  return;
};

export const userService = {
  createUserIntoDB,
  createPendingUserIntoDB,
  getUsers,
  getSingleUserIntoDB,
  updateUser,
  deleteMyAccount,
  socialLoginIntoDB,
  resendVerifyOTP,
  deleteUser,
};
