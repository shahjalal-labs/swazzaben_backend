import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { businessLoanRoutes } from "../modules/businessloan/businessLoan.routes";
import { modificationsRoutes } from "../modules/modifications/modifications.routes";
import { messageRoute } from "../modules/message/message.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/business-loan",
    route: businessLoanRoutes,
  },
  {
    path: "/modifications",
    route: modificationsRoutes,
  },
  {
    path: "/messages",
    route: messageRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
