import express from "express";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
router.get("/login", rateLimiter(3, 0.5), (req, res) => {
  res.status(200).json({ msg: "Login endpoint (strict limit)" });
});

router.get("/test", rateLimiter(5, 1), (req, res) => {
  res.status(200).json({ msg: "Request successful", clientId: req.ip });
});

router.get("/data", rateLimiter(10, 2), (req, res) => {
  res.status(200).json({ msg: "Data endpoint (looser limit)" });
});

export default router;