import { type Algorithm, type EventStatus } from "@prisma/client";
import {
  EventRepository,
  type CreateEventData,
  type ListEventsFilters,
} from "../repositories/event.repository.js";

const eventRepository = new EventRepository();

export class EventService {
  async create(data: CreateEventData) {
    return eventRepository.create(data);
  }

  async list(filters: ListEventsFilters) {
    return eventRepository.findMany(filters);
  }

  async getById(id: string) {
    const event = await eventRepository.findById(id);

    if (!event) {
      throw new Error("Evento não encontrado");
    }

    return event;
  }

  async updateStatus(id: string, status: EventStatus, notes?: string) {
    await this.getById(id);
    return eventRepository.updateStatus(id, status, notes);
  }

  async remove(id: string) {
    await this.getById(id);
    return eventRepository.delete(id);
  }
}

export function parseAlgorithm(value: unknown): Algorithm {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");

  if (normalized === "RMS_SIMPLE") return "RMS_SIMPLE";
  if (normalized === "RMS_TWO_STAGE" || normalized === "TWO_STAGE")
    return "RMS_TWO_STAGE";

  return "UNKNOWN";
}

export function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function parseOptionalInteger(value: unknown): number | undefined {
  const number = parseOptionalNumber(value);
  return number === undefined ? undefined : Math.trunc(number);
}
