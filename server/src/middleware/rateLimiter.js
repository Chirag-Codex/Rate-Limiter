import {checkRateLimit} from "../lib/bucketService.js";
import { validateClientId } from "../lib/validateClientId.js";
export function rateLimiter(capacity, refillRate) {
  return async (req, res, next) => {
    try{
        const rawClientId=req.ip ;
        const clientId=validateClientId(rawClientId);
        if(!clientId){
            console.warn(`[RateLimit] Invalid clientId: ${rawClientId}`);
            return res.status(400).json({ error: "Bad Request", msg: "Invalid client identifier" });
        }
        const {allowed,retryAfter,tokens}=await checkRateLimit(clientId,capacity,refillRate);
        res.setHeader("X-RateLimit-Limit",capacity);
        res.setHeader("X-RateLimit-Remaining",Math.floor(tokens));
        if(!allowed){
            console.warn(
          `[RateLimit] Rejected ${clientId} at ${new Date().toISOString()} — retry after ${retryAfter}s`
            );
            res.setHeader("Retry-After",retryAfter);
            return res.status(429).json({
          error: "Too Many Requests",
          msg: "Rate limit exceeded. Please slow down.",
          retryAfter,
        });
        }
        next();
    }
    catch(err){
        console.error(`Error in rate limiter middleware: ${err.message}`);
        res.status(500).json({msg:"Internal Server Error"});
    }
  }
}