import { PrismaClient } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
const prisma = new PrismaClient();

const createModifications = async (
  logoUrl?: Express.Multer.File,
  faveiconUrl?: Express.Multer.File
) => {
  console.log({ logoUrl, faveiconUrl });
  let logo;
  let faveicon;

  // ✅ Upload logo if file is provided
  if (logoUrl) {
    try {
      const uploadedLogo = await uploadToDigitalOceanAWS(logoUrl);
      logo = uploadedLogo?.Location;
    } catch (error: any) {
      throw new ApiError(500, "Failed to upload logo");
    }
  }

  // ✅ Upload favicon if file is provided
  if (faveiconUrl) {
    try {
      const uploadedFavicon = await uploadToDigitalOceanAWS(faveiconUrl);
      faveicon = uploadedFavicon?.Location;
    } catch (error: any) {
      throw new ApiError(500, "Failed to upload favicon");
    }
  }

  // ✅ Check if any logo already exists
  const existingLogo = await prisma.logo.findFirst();

  // ✅ If exists, update; otherwise create new
  if (existingLogo) {
    return await prisma.logo.update({
      where: { id: existingLogo.id },
      data: {
        logoUrl: logo || existingLogo.logoUrl,
        faveiconUrl: faveicon || existingLogo.faveiconUrl,
      },
    });
  } else {
    return await prisma.logo.create({
      data: {
        logoUrl: logo,
        faveiconUrl: faveicon,
      },
    });
  }
};

const getLogoAndFavicon = async () => {
  const logo = await prisma.logo.findFirst();
  if (!logo) {
    throw new ApiError(404, "Logo and Favicon not found! please add first");
  }
  return logo;
};

const saveSocialLinks = async (links: {
  facebookLink?: string;
  linekedInLink?: string;
  instagramLink?: string;
  twitterLink?: string;
}) => {
  // Check if social links already exist
  const existingLinks = await prisma.socialLinks.findFirst();

  if (existingLinks) {
    // Update existing links
    return await prisma.socialLinks.update({
      where: { id: existingLinks.id },
      data: {
        facebookLink: links.facebookLink || existingLinks.facebookLink,
        linekedInLink: links.linekedInLink || existingLinks.linekedInLink,
        instagramLink: links.instagramLink || existingLinks.instagramLink,
        twitterLink: links.twitterLink || existingLinks.twitterLink,
      },
    });
  } else {
    // Create new social links
    return await prisma.socialLinks.create({
      data: {
        facebookLink: links.facebookLink,
        linekedInLink: links.linekedInLink,
        instagramLink: links.instagramLink,
        twitterLink: links.twitterLink,
      },
    });
  }
};

const getSocialLinks = async () => {
  const links = await prisma.socialLinks.findFirst();
  if (!links) {
    throw new ApiError(404, "Social links not found! please add first");
  }
  return links;
};
const saveContactInformations = async (payload: {
  number: string;
  email: string;
  address: string;
}) => {
  // Check if contact information already exists
  const existingInfo = await prisma.contactInformations.findFirst();

  if (existingInfo) {
    // Update existing links
    return await prisma.contactInformations.update({
      where: { id: existingInfo.id },
      data: {
        number: payload.number || existingInfo.number,
        email: payload.email || existingInfo.email,
        address: payload.address || existingInfo.address,
      },
    });
  } else {
    // Create new social links
    return await prisma.contactInformations.create({
      data: {
        number: payload.number,
        email: payload.email,
        address: payload.address,
      },
    });
  }
};

const getContactInformations = async () => {
  const info = await prisma.contactInformations.findFirst();
  if (!info) {
    throw new ApiError(404, "Contact information not found! please add first");
  }
  return info;
};
const savePrivacyPolicy = async (payload: { content: string }) => {
  // Check if privacy policy already exists
  const existingPrivacyPolicy = await prisma.privacyPolicy.findFirst();

  if (existingPrivacyPolicy) {
    // Update existing links
    return await prisma.privacyPolicy.update({
      where: { id: existingPrivacyPolicy.id },
      data: {
        content: payload.content || existingPrivacyPolicy.content,
      },
    });
  } else {
    // Create new social links
    return await prisma.privacyPolicy.create({
      data: {
        content: payload.content,
      },
    });
  }
};

const getPrivacyPolicy = async () => {
  const info = await prisma.privacyPolicy.findFirst();
  if (!info) {
    throw new ApiError(404, "Privacy policy not found! please add first");
  }
  return info;
};
const saveTermsAndConditions = async (payload: { content: string }) => {
  // Check if terms and conditions already exists
  const existingTermsAndConditions = await prisma.termsAndConditions.findFirst();

  if (existingTermsAndConditions) {
    // Update existing links
    return await prisma.termsAndConditions.update({
      where: { id: existingTermsAndConditions.id },
      data: {
        content: payload.content || existingTermsAndConditions.content,
      },
    });
  } else {
    // Create new social links
    return await prisma.termsAndConditions.create({
      data: {
        content: payload.content,
      },
    });
  }
};

const getTermsAndConditions = async () => {
  const info = await prisma.termsAndConditions.findFirst();
  if (!info) {
    throw new ApiError(404, "Terms and Conditions not found! please add first");
  }
  return info;
};
const saveSecurityAwareness = async (payload: { content: string }) => {
  // Check if security awareness already exists
  const existingSecurityAwareness = await prisma.securityAwareness.findFirst();

  if (existingSecurityAwareness) {
    // Update existing links
    return await prisma.securityAwareness.update({
      where: { id: existingSecurityAwareness.id },
      data: {
        content: payload.content || existingSecurityAwareness.content,
      },
    });
  } else {
    // Create new social links
    return await prisma.securityAwareness.create({
      data: {
        content: payload.content,
      },
    });
  }
};

const getSecurityAwareness = async () => {
  const info = await prisma.securityAwareness.findFirst();
  if (!info) {
    throw new ApiError(404, "Security Awareness not found! please add first");
  }
  return info;
};

export const modificationsServices = {
  createModifications,
  getLogoAndFavicon,
  saveSocialLinks,
  getSocialLinks,
  saveContactInformations,
  getContactInformations,
  getPrivacyPolicy,
  savePrivacyPolicy,
  getTermsAndConditions,
  saveTermsAndConditions,
  saveSecurityAwareness,
  getSecurityAwareness
};
