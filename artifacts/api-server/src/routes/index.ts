import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import staffAuthRouter from "./staff_auth";
import requestsRouter from "./requests";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(staffAuthRouter);
router.use(requestsRouter);
router.use(paymentsRouter);

export default router;
