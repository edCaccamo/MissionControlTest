// App factory — kept separate from server.ts so tests can import
// without binding to a port.

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import errorHandler from "./plugins/errorHandler";
import { mediaRoutes } from "./routes/media.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true, // Structured JSON logging out of the box
  });

  // Register plugins
  app.register(cors);
  app.register(errorHandler);

  app.register(mediaRoutes, { prefix: "/media" });
  app.register(analyticsRoutes, { prefix: "/analytics" });
  app.register(dashboardRoutes, { prefix: "/dashboard" });

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return app;
}
