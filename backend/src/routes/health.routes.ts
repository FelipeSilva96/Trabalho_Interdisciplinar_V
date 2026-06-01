import { type FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      ok: true,
      service: "NoiseWatch API",
      timestamp: new Date().toISOString(),
    };
  });
}
