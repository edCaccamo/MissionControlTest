import { FastifyRequest, FastifyReply } from "fastify";
import { dashboardSchema } from "../schemas/media.schema";
import { getDashboard } from "../services/dashboard.service";

export async function dashboardHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parsed = dashboardSchema.safeParse(request.query);
  const keyword = parsed.success ? parsed.data.keyword : "Earth";

  const result = await getDashboard(keyword);
  return reply.send(result);
}
