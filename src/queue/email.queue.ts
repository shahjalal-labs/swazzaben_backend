import { Queue } from "bullmq";
import redisClient from "../helpers/radis";
export const emailQueue = new Queue("email", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  },
});