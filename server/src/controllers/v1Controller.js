import crypto from "crypto";
import Project from "../models/Project.js";
import { checkRateLimit } from "../lib/bucketService.js";

export async function publicCheck(req, res) {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({ msg: "API key required" });
    }

    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
    const project = await Project.findOne({ apiKeyHash: hashedKey });

    if (!project) {
      return res.status(401).json({ msg: "Invalid API key" });
    }

    const { clientId } = req.body;
    if (
      !clientId ||
      typeof clientId !== "string" ||
      clientId.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ msg: "clientId must be a non-empty string" });
    }
    const cleanClientId = clientId.trim();
    if (cleanClientId.length > 128 || !/^[\w\-\.:]+$/.test(cleanClientId)) {
      return res
        .status(400)
        .json({ msg: "clientId must be alphanumeric and <= 128 chars" });
    }
    
    const namespacedClientId = `${project._id}:${cleanClientId}`;

    const { allowed, retryAfter, tokens } = await checkRateLimit(
      namespacedClientId,
      project.capacity,
      project.refillRate,
    );

    if (allowed) {
      await Project.updateOne(
        { _id: project._id },
        { $inc: { allowedCount: 1 } },
      );
    } else {
      await Project.updateOne(
        { _id: project._id },
        { $inc: { deniedCount: 1 } },
      );
    }

    res.setHeader("X-RateLimit-Limit", project.capacity);
    res.setHeader("X-RateLimit-Remaining", Math.floor(tokens));

    if (!allowed) {
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too Many Requests",
        msg: "Rate limit exceeded",
        retryAfter,
      });
    }

    return res.status(200).json({ allowed: true, retryAfter: 0, tokens });
  } catch (err) {
    console.error("Error in publicCheck:", err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
}
