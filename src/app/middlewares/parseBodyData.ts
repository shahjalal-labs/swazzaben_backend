import { NextFunction, Request, Response } from "express";

export const parseBodyData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const payloadStr = req.body.bodyData || req.body.data;
  if (payloadStr && typeof payloadStr === "string") {
    try {
      req.body = JSON.parse(payloadStr);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in bodyData/data",
      });
    }
  }
  next();
};
