import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 3000 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/webm",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/x-matroska",
      "application/pdf",
    ];
    // if (!allowedMimeTypes.includes(file.mimetype)) {
    //   return cb(new Error("File type not allowed") as unknown as null, false);
    // }
    cb(null, true);
  },
});

// upload single image
const videoUrl = upload.single("videoUrl");
const profileImage = upload.single("profileImage");
const coverPhoto = upload.single("coverPhoto");
const experienceFile = upload.single("experienceFile");
const uploadOverviewPdf = upload.single("overviewPdf");

// upload multiple image
const uploadMultiple = upload.fields([
  { name: "ownersSig", maxCount: 10 },
  { name: "approvalFiles", maxCount: 10 },
  { name: "logo", maxCount: 1 },
  {
    name: "faveicon",
    maxCount: 1,
  },
]);
const uploadMultipleMainApi = upload.fields([
  { name: "overviewPdf", maxCount: 1 },
  { name: "approvalFiles", maxCount: 10 },
]);

// upload message files
const sendFiles = upload.fields([
  { name: "messageFiles", maxCount: 10 },
]);

export const fileUploader = {
  upload,
  videoUrl,
  uploadMultiple,
  profileImage,
  coverPhoto,
  uploadOverviewPdf,
  experienceFile,
  uploadMultipleMainApi,
  sendFiles,
};
