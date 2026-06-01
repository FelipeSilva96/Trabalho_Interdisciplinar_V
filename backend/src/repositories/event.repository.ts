import { type Algorithm, type EventStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface CreateEventData {
  deviceId?: string;
  algorithm: Algorithm;
  rms?: number;
  threshold?: number;
  latencyUs?: number;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  imagePath: string;
  imageUrl: string;
}

export interface ListEventsFilters {
  page: number;
  limit: number;
  deviceId?: string;
  status?: EventStatus;
  algorithm?: Algorithm;
}

export class EventRepository {
  async create(data: CreateEventData) {
    return prisma.event.create({
      data,
      include: { device: true },
    });
  }

  async findMany(filters: ListEventsFilters) {
    const skip = (filters.page - 1) * filters.limit;

    const where = {
      deviceId: filters.deviceId,
      status: filters.status,
      algorithm: filters.algorithm,
    };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { device: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: { device: true },
    });
  }

  async updateStatus(id: string, status: EventStatus, notes?: string) {
    return prisma.event.update({
      where: { id },
      data: { status, notes },
      include: { device: true },
    });
  }

  async delete(id: string) {
    return prisma.event.delete({
      where: { id },
    });
  }
}
