import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { type Algorithm, type EventStatus } from "@prisma/client";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import {
  EventService,
  parseAlgorithm,
  parseOptionalInteger,
  parseOptionalNumber,
} from "../services/event.service.js";

const eventService = new EventService();
const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);

function getFieldValue(
  fields: Record<string, unknown>,
  fieldName: string,
): unknown {
  const field = fields[fieldName] as
    | { value?: unknown }
    | Array<{ value?: unknown }>
    | undefined;

  if (Array.isArray(field)) return field[0]?.value;
  return field?.value;
}

function buildPublicImageUrl(relativePath: string) {
  const normalizedPath = relativePath
    .replaceAll("\\\\", "/")
    .replaceAll("\\", "/");
  return `${env.PUBLIC_URL.replace(/\/$/, "")}/uploads/${normalizedPath}`;
}

export class EventController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        ok: false,
        message: "Envie a imagem no campo multipart chamado 'image'.",
      });
    }

    if (file.fieldname !== "image") {
      return reply.status(400).send({
        ok: false,
        message: "O campo do arquivo deve se chamar 'image'.",
      });
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      return reply.status(415).send({
        ok: false,
        message: "Formato inválido. Envie JPEG ou PNG.",
      });
    }

    const extension = file.mimetype === "image/png" ? "png" : "jpg";
    const fileName = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.${extension}`;
    const relativeDir = path.join("events");
    const absoluteDir = path.resolve(
      process.cwd(),
      env.UPLOAD_DIR,
      relativeDir,
    );
    const absolutePath = path.join(absoluteDir, fileName);
    const relativePath = path.join(relativeDir, fileName);

    await mkdir(absoluteDir, { recursive: true });

    let fileSize = 0;
    const countBytes = new Transform({
      transform(chunk, _encoding, callback) {
        fileSize += Buffer.byteLength(chunk);
        callback(null, chunk);
      },
    });

    await pipeline(file.file, countBytes, createWriteStream(absolutePath));

    try {
      const fields = file.fields as Record<string, unknown>;
      const query = request.query as Record<string, unknown>;

      const deviceId =
        String(getFieldValue(fields, "deviceId") ?? query.deviceId ?? "") ||
        undefined;
      const algorithm = parseAlgorithm(
        getFieldValue(fields, "algorithm") ?? query.algorithm,
      );
      const rms = parseOptionalNumber(
        getFieldValue(fields, "rms") ?? query.rms,
      );
      const threshold = parseOptionalNumber(
        getFieldValue(fields, "threshold") ?? query.threshold,
      );
      const latencyUs = parseOptionalInteger(
        getFieldValue(fields, "latencyUs") ?? query.latencyUs,
      );

      const createdEvent = await eventService.create({
        deviceId,
        algorithm,
        rms,
        threshold,
        latencyUs,
        fileName,
        mimeType: file.mimetype,
        fileSize,
        imagePath: relativePath.replaceAll("\\", "/"),
        imageUrl: buildPublicImageUrl(relativePath),
      });

      return reply.status(201).send({
        ok: true,
        event: createdEvent,
      });
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined);
      throw error;
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      page?: string;
      limit?: string;
      deviceId?: string;
      status?: EventStatus;
      algorithm?: Algorithm;
    };

    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);

    const result = await eventService.list({
      page,
      limit,
      deviceId: query.deviceId,
      status: query.status,
      algorithm: query.algorithm,
    });

    return reply.send({ ok: true, ...result });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const event = await eventService.getById(id);

    return reply.send({ ok: true, event });
  }

  async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as { status: EventStatus; notes?: string };

    const event = await eventService.updateStatus(id, body.status, body.notes);

    return reply.send({ ok: true, event });
  }

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await eventService.remove(id);

    return reply.status(204).send();
  }
}
