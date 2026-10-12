import * as z from 'zod';
 
export const createModificationsSchema = z.object({
  // Define fields
  name: z.string(),
});
 
export const ModificationsSchemaValidation = {
createModificationsSchema
};
  
export const changesocialMediaSchema = z.object({
  facebookLink: z.string().url().optional(),
  linekedInLink: z.string().url().optional(),
  instagramLink: z.string().url().optional(),
  twitterLink: z.string().url().optional(),
});
