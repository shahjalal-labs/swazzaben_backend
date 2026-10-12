import { Request, Response } from "express";
import { modificationsServices } from "./modifications.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createModifications = catchAsync(async (req: Request, res: Response) => {
  // both files are optional
  const files = req.files as {
    logo?: Express.Multer.File[];
    faveicon?: Express.Multer.File[];
  };

  const logo = files?.logo?.length ? files.logo[0] : undefined;
  const faveicon = files?.faveicon?.length ? files.faveicon[0] : undefined;

  const result = await modificationsServices.createModifications(
    logo,
    faveicon
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The logo changes have been successful",
    data: result,
  });
});

const getLogoAndFavicon = catchAsync(async (_req: Request, res: Response) => {
  const result = await modificationsServices.getLogoAndFavicon();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "logo and favicons have been retrieved successfully",
    data: result,
  });
});

const saveSocialLinks = catchAsync(async (req: Request, res: Response) => {
  const result = await modificationsServices.saveSocialLinks(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Social links changes have been successful",
    data: result,
  });
});

const getSocialLinks = catchAsync(async (_req: Request, res: Response) => {
  const result = await modificationsServices.getSocialLinks();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "social links have been retrieved successfully",
    data: result,
  });
});
const saveContactInformations = catchAsync(
  async (req: Request, res: Response) => {
    const result = await modificationsServices.saveContactInformations(
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Contact information changes have been successful",
      data: result,
    });
  }
);

const getContactInformations = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await modificationsServices.getContactInformations();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "social links have been retrieved successfully",
      data: result,
    });
  }
);
const savePrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await modificationsServices.savePrivacyPolicy(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Privacy policy changes have been successful",
    data: result,
  });
});

const getPrivacyPolicy = catchAsync(async (_req: Request, res: Response) => {
  const result = await modificationsServices.getPrivacyPolicy();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Privacy policy has been retrieved successfully",
    data: result,
  });
});
const saveTermsAndConditions = catchAsync(
  async (req: Request, res: Response) => {
    const result = await modificationsServices.saveTermsAndConditions(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Terms and conditions changes have been successful",
      data: result,
    });
  }
);

const getTermsAndConditions = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await modificationsServices.getTermsAndConditions();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Terms and conditions have been retrieved successfully",
      data: result,
    });
  }
);
const saveSecurityAwareness = catchAsync(
  async (req: Request, res: Response) => {
    const result = await modificationsServices.saveSecurityAwareness(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Security awareness changes have been successful",
      data: result,
    });
  }
);

const getSecurityAwareness = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await modificationsServices.getSecurityAwareness();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Security awareness has been retrieved successfully",
      data: result,
    });
  }
);

export const modificationsControllers = {
  createModifications,
  getLogoAndFavicon,
  saveSocialLinks,
  getSocialLinks,
  saveContactInformations,
  getContactInformations,
  savePrivacyPolicy,
  getPrivacyPolicy,
  saveTermsAndConditions,
  getTermsAndConditions,
  getSecurityAwareness,
  saveSecurityAwareness
};
