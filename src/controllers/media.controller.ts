
import { FastifyRequest, FastifyReply } from "fastify";
import { mediaSearchSchema, nasaIdSchema } from "../schemas/media.schema";
import { searchMedia, getMediaDetail } from "../services/media.service";
import { parsePaginationParams } from "../utils/pagination";
import { BadRequestError } from "../utils/errors";

export async function searchMediaHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parsed = mediaSearchSchema.safeParse(request.query);
  if (!parsed.success) {
    throw new BadRequestError(
      parsed.error.issues.map((e) => e.message).join(", ")
    );
  }

  const { page, pageSize, ...searchParams } = parsed.data;
  const pagination = parsePaginationParams(page, pageSize);

  const result = await searchMedia(searchParams, pagination);
  return reply.send(result);
}

export async function getMediaDetailHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parsed = nasaIdSchema.safeParse(request.params);
  if (!parsed.success) {
    throw new BadRequestError("Invalid NASA ID");
  }

  const result = await getMediaDetail(parsed.data.nasa_id);
  return reply.send(result);
}
