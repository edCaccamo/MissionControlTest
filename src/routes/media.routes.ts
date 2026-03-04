
import { FastifyInstance } from "fastify";
import {
  searchMediaHandler,
  getMediaDetailHandler,
} from "../controllers/media.controller";

export async function mediaRoutes(fastify: FastifyInstance) {
  // GET /media/search?q=mars&mediaType=image&yearStart=2020&page=1&pageSize=10
  fastify.get("/search", searchMediaHandler);

  // GET /media/:nasa_id
  fastify.get("/:nasa_id", getMediaDetailHandler);
}
