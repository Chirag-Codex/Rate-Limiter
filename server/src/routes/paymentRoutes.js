import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", protectRoute, createOrder);
router.post("/verify-payment", protectRoute, verifyPayment);

export default router;