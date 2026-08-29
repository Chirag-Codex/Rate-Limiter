import "dotenv/config";

export const ENV={
    PORT: process.env.PORT || 5000,
    DB_URL: process.env.DB_URL ,
    NODE_ENV: process.env.NODE_ENV || "development",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    JWT_SECRET: process.env.JWT_SECRET
}