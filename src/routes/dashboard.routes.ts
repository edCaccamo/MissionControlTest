import { FastifyInstance } from "fastify";
import { dashboardHandler } from "../controllers/dashboard.controller";

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /dashboard?keyword=Earth
  fastify.get("/", dashboardHandler);
}
