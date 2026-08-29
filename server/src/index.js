import express from "express";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import demoRoutes from "./routes/demoRoutes.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import v1Routes from "./routes/v1Routes.js";
const app = express();
app.set("trust proxy", 1);

app.use(helmet());

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
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.use("/auth", authRoutes);
app.use("/api", demoRoutes);
app.use("/projects", projectRoutes);
app.use("/v1", v1Routes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});
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
    console.error("Error: DB_URL is not set in environment variables.");
    process.exit(1);
  }
  if (ENV.NODE_ENV === "production" && ENV.CLIENT_URL === "*") {
    console.error("Error: CLIENT_URL is not set in environment variables.");
    process.exit(1);
  }
}
const startServer = async () => {
  validateEnv();
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(
        `Server is running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`,
      );
    });
  } catch (err) {
    console.error(`Error starting server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
