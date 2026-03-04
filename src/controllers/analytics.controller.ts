import { FastifyRequest, FastifyReply } from "fastify";
import { yearSchema, topicSchema } from "../schemas/media.schema";
import {
  getYearSummary,
  getTopicInsight,
} from "../services/analytics.service";
import { BadRequestError } from "../utils/errors";

export async function yearSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parsed = yearSchema.safeParse(request.params);
  if (!parsed.success) {
    throw new BadRequestError("Invalid year — must be a 4-digit year");
  }

  const result = await getYearSummary(parsed.data.year);
  return reply.send(result);
}

export async function topicInsightHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parsed = topicSchema.safeParse(request.params);
  if (!parsed.success) {
    throw new BadRequestError("Keyword is required");
  }

  const result = await getTopicInsight(parsed.data.keyword);
  return reply.send(result);
}
