import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 5050,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_2DFU0vpwIWgj@ep-green-snow-ae60fpd3-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
  JWT_SECRET: process.env.JWT_SECRET || "agronexus_super_secure_jwt_secret_2026_x99",
  JWT_EXPIRES_IN: "7d",
  PASSKEY_SESSION_DURATION_MS: 30 * 60 * 1000,
  SIMULATOR_INTERVAL_MS: 4000
};
