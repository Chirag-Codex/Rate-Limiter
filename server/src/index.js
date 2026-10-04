import express from "express";
import { ENV } from "./lib/env.js";
import { connectDB, disconnectDB } from "./lib/db.js";
import demoRoutes from "./routes/demoRoutes.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import v1Routes from "./routes/v1Routes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
const app = express();
app.set("trust proxy", 1);

app.use(helmet());

// Fast, unthrottled health check for load balancer and platform probes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    msg: "Global rate limit exceeded. Please try again later.",
  },
});
app.use(globalLimiter);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);

      const configuredOrigins = ENV.CLIENT_URL ? ENV.CLIENT_URL.split(",").map((o) => o.trim()) : [];
      const isAllowed =
        configuredOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin === "https://rate-limiter-ruddy.vercel.app";

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} blocked by CORS policy`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.use("/auth", authRoutes);
app.use("/api", demoRoutes);
app.use("/projects", projectRoutes);
app.use("/v1", v1Routes);
app.use("/api/payments", paymentRoutes);
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    msg: `Cannot ${req.method} ${req.path}`,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message);
  res
    .status(err.status || 500)
    .json({
      error: "Internal Server Error",
      msg: "Something went wrong. Please try again later.",
    });
});

function validateEnv() {
  if (!ENV.DB_URL) {
    console.error("Fatal: DB_URL is not set in environment variables.");
    process.exit(1);
  }
  if (!ENV.JWT_SECRET || ENV.JWT_SECRET.trim().length === 0) {
    console.error("Fatal: JWT_SECRET is not set in environment variables.");
    process.exit(1);
  }
  if (ENV.NODE_ENV === "production") {
    if (!ENV.CLIENT_URL || ENV.CLIENT_URL === "*" || ENV.CLIENT_URL.includes("localhost")) {
      console.warn(
        "Warning: CLIENT_URL should be set to your deployed frontend domain in production (currently:",
        ENV.CLIENT_URL,
        ")"
      );
    }
  }
}

let server;

const startServer = async () => {
  validateEnv();
  try {
    await connectDB();
    server = app.listen(ENV.PORT, () => {
      console.log(
        `Server is running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`,
      );
    });
  } catch (err) {
    console.error(`Error starting server: ${err.message}`);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await disconnectDB();
        process.exit(0);
      } catch (err) {
        console.error("Error during database shutdown:", err.message);
        process.exit(1);
      }
    });

   
    setTimeout(() => {
      console.error("Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();
