import { Router, type IRouter } from "express";
import healthRouter from "./health";
import zonesRouter from "./zones";

const router: IRouter = Router();

router.use(healthRouter);
router.use(zonesRouter);

export default router;
