import express from "express";
import rateLimit from "express-rate-limit";
import { publicCheck } from "../controllers/v1Controller.js";

const router = express.Router();

const publicLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 120,          
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    msg: "Too many requests to /v1/check",
  },
});

router.post("/check", publicLimiter, publicCheck);

export default router;