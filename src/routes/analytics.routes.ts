import { FastifyInstance } from "fastify";
import {
  yearSummaryHandler,
  topicInsightHandler,
} from "../controllers/analytics.controller";

export async function analyticsRoutes(fastify: FastifyInstance) {
  // GET /analytics/year/2020
  fastify.get("/year/:year", yearSummaryHandler);

  // GET /analytics/topic/mars
  fastify.get("/topic/:keyword", topicInsightHandler);
}
