
export function refillBucket(bucket, now) {
 
  let elapsed = (now - bucket.lastRefill) / 1000;

 
  if (elapsed < 0) elapsed = 0;

 
  const tokensToAdd = elapsed * bucket.refillRate;


  const newTokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);

  return {
    ...bucket,
    tokens: newTokens,
    lastRefill: now,
  };
}


export function consumeToken(bucket, now) {
 
  const refilled = refillBucket(bucket, now);

 
  if (refilled.tokens >= 1) {
   
    return {
      allowed: true,
      bucket: {
        ...refilled,
        tokens: refilled.tokens - 1,
      },
      retryAfter: 0,
    };
  }

  const secondsUntilNextToken = 1 / refilled.refillRate;

  const retryAfter = Math.ceil(secondsUntilNextToken);

  return {
    allowed: false,
    bucket: refilled,
    retryAfter,
  };
}