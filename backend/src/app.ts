import path from "node:path";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { eventRoutes } from "./routes/events.routes.js";
import { healthRoutes } from "./routes/health.routes.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: [
      env.FRONTEND_ORIGIN,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
      files: 1,
    },
  });

  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), env.UPLOAD_DIR),
    prefix: "/uploads/",
  });

  await app.register(healthRoutes);
  await app.register(eventRoutes);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    return reply.status(500).send({
      ok: false,
      message: error.message || "Erro interno no servidor",
    });
  });

  return app;
}
