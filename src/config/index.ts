
import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nasa: {
    baseUrl: process.env.NASA_API_BASE_URL || "https://images-api.nasa.gov",
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || "300", 10), // seconds
  },
};
