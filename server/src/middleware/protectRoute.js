import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import User from "../models/User.js";

export async function protectRoute(req, res, next) {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ msg: "Unauthorized: No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-passwordHash");
        if (!user) {
            return res.status(401).json({ msg: "Not authorized: User not found" });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Not authorized: Invalid token or expired" });
    }
}