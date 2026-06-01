import { type FastifyInstance } from "fastify";
import { EventController } from "../controllers/event.controller.js";

const eventController = new EventController();

export async function eventRoutes(app: FastifyInstance) {
  app.post("/api/events", eventController.create.bind(eventController));
  app.get("/api/events", eventController.list.bind(eventController));
  app.get("/api/events/:id", eventController.getById.bind(eventController));
  app.patch(
    "/api/events/:id/status",
    eventController.updateStatus.bind(eventController),
  );
  app.delete("/api/events/:id", eventController.remove.bind(eventController));
}
