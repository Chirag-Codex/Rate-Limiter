import Bucket from "../models/Bucket.js";

/**
 * Atomically applies token bucket rate limit for a client.
 * Uses MongoDB update pipeline to avoid race conditions.
 *
 * @param {string} clientId - Unique identifier (e.g., IP address).
 * @param {number} capacity - Maximum tokens the bucket can hold.
 * @param {number} refillRate - Tokens added per second.
 * @returns {Promise<{allowed: boolean, retryAfter: number, tokens: number}>}
 */
export async function checkRateLimit(clientId, capacity, refillRate) {
  const now = Date.now();

  const updatePipeline = [
   
    {
      $set: {
        clientId: clientId,  
        capacity: { $ifNull: ["$capacity", capacity] },
        refillRate: { $ifNull: ["$refillRate", refillRate] },
        tokens: { $ifNull: ["$tokens", capacity] },
        lastRefill: { $ifNull: ["$lastRefill", now] },
      },
    },
 
    {
      $set: {
        refilledTokens: {
          $let: {
            vars: {
              elapsed: {
                $divide: [{ $subtract: [now, "$lastRefill"] }, 1000],
              },
            },
            in: {
              $min: [
                "$capacity",
                {
                  $add: [
                    "$tokens",
                    { $multiply: ["$$elapsed", "$refillRate"] },
                  ],
                },
              ],
            },
          },
        },
        lastRefill: now,
      },
    },
 
    {
      $set: {
        tokens: {
          $cond: [
            { $gte: ["$refilledTokens", 1] },
            { $subtract: ["$refilledTokens", 1] },
            "$refilledTokens",
          ],
        },
        lastRequestAllowed: { $gte: ["$refilledTokens", 1] },
      },
    },
 
    {
      $unset: "refilledTokens",
    },
  ];

  const doc = await Bucket.findOneAndUpdate(
    { clientId },
    updatePipeline,
    {
      new: true,          
      upsert: true,       
      updatePipeline: true, 
    }
  );

  const allowed = doc.lastRequestAllowed;
  const retryAfter = allowed ? 0 : Math.ceil((1 - doc.tokens) / doc.refillRate);

  return {
    allowed,
    retryAfter,
    tokens: doc.tokens,
  };
}