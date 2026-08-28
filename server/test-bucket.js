// Simple test script for the rate limiter API.

const BASE_URL = "http://localhost:5000/api/test";

async function makeRequest(label) {
  try {
    const res = await fetch(BASE_URL);
    const body = await res.json();
    console.log(`${label}: status=${res.status}, body=${JSON.stringify(body)}`);
    return { status: res.status, body };
  } catch (err) {
    console.error(`${label}: fetch error`, err.message);
  }
}

async function main() {
  console.log("=== Test 1: Burst traffic (7 rapid requests) ===");
  for (let i = 1; i <= 7; i++) {
    await makeRequest(`Request ${i}`);
  }

  console.log("\n=== Test 2: Refill timing (wait 1.5s, then one more) ===");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await makeRequest("After refill");

  console.log("\n=== Test 3: Concurrent requests (10 simultaneous) ===");
  const concurrentResults = await Promise.all(
    Array.from({ length: 10 }, (_, i) => makeRequest(`Concurrent ${i + 1}`))
  );

  const allowedCount = concurrentResults.filter(
    (r) => r && r.status === 200
  ).length;
  const deniedCount = concurrentResults.length - allowedCount;
  console.log(`\nConcurrent test summary: ${allowedCount} allowed, ${deniedCount} denied`);
}

main().catch(console.error);