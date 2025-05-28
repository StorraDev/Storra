import { healthCheck } from "./healthcheck.controller.js";

import { Router } from "express";

const router = Router();
router.route("/healthcheck").post(healthCheck)

export default router;