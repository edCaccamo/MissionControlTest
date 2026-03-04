
import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "../utils/errors";

async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
      const statusCode =
        error instanceof AppError
          ? error.statusCode
          : error.statusCode || 500;

      const response = {
        statusCode,
        error: error.name || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      };

      if (statusCode >= 500) {
        request.log.error(error);
      }

      reply.status(statusCode).send(response);
    }
  );
}

export default fp(errorHandler);
