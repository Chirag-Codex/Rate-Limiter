# Rate Limiter

A full-stack token-bucket rate-limiting demo. The server stores buckets in MongoDB and exposes sample protected endpoints. The React dashboard provides an interactive client-side visualization of the same endpoint limits.

## Features

- Global server limit of 100 requests per minute
- Per-client token-bucket limits backed by MongoDB
- Atomic MongoDB update pipeline to handle concurrent requests safely
- Helmet, CORS, JSON body-size limits, health check, and JSON error responses
- React/Vite dashboard with token counts, refill timing, request counts, and status indicators

## Project Structure

```text
client/              React + Vite dashboard
server/              Express API and MongoDB-backed rate limiter
server/src/lib/      Database, environment, bucket, and validation helpers
server/src/middleware/
                     Reusable rate-limiter middleware
server/src/models/   Mongoose bucket model
server/src/routes/   Demo API routes
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally or an accessible MongoDB connection string

## Setup

Install dependencies in both packages:

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env` with values for your environment:

```env
PORT=5000
DB_URL=mongodb://127.0.0.1:27017/rate_limiter_db
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

`DB_URL` is required. In production, set `CLIENT_URL` to the actual frontend origin instead of the development default.

## Run Locally

Start the API in one terminal:

```bash
cd server
npm start
```

Start the Vite dashboard in another terminal:

```bash
cd client
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

The Vite development proxy forwards `/api` and `/health` requests to `http://localhost:5000`.

## API

All demo routes use the request IP as the client identifier. A successful response includes `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers. A rejected request returns HTTP `429` with a `Retry-After` header.

| Method | Path | Capacity | Refill rate |
| --- | --- | ---: | ---: |
| GET | `/api/login` | 3 tokens | 0.5 tokens/second |
| GET | `/api/test` | 5 tokens | 1 token/second |
| GET | `/api/data` | 10 tokens | 2 tokens/second |
| GET | `/health` | No route-specific limit | Returns server status |

Example requests:

```bash
curl http://localhost:5000/health
curl -i http://localhost:5000/api/test
```

The server also applies a global limit of 100 requests per minute before route-specific middleware runs.

## Testing the Limiter

With the server and MongoDB running, execute the request burst/concurrency script:

```bash
cd server
node test-bucket.js
```

The script sends rapid requests to `/api/test`, waits for token refill, and then sends concurrent requests to demonstrate the atomic bucket update.

## Client Dashboard Note

The dashboard currently uses a local token-bucket simulation in `client/src/App.jsx`. It is useful for demonstrating the endpoint states without a backend connection, but its displayed state is separate from the MongoDB-backed server buckets.

## Production Considerations

- Use a managed MongoDB deployment or a secured MongoDB instance.
- Configure a specific trusted proxy setup instead of blindly trusting proxy hops when deploying behind a proxy.
- Set a production `CLIENT_URL` and keep `.env` files out of version control.
- Consider a shared distributed store and monitoring strategy when running multiple API instances.
