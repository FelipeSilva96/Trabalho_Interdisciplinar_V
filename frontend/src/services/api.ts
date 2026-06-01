const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export interface NoiseWatchEvent {
  id: string;
  algorithm: "RMS_SIMPLE" | "RMS_TWO_STAGE" | "UNKNOWN";
  rms?: number | null;
  threshold?: number | null;
  latencyUs?: number | null;
  imageUrl: string;
  status: "PENDING" | "REVIEWED" | "DISCARDED";
  createdAt: string;
}

export interface ListEventsResponse {
  ok: boolean;
  items: NoiseWatchEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listEvents(): Promise<ListEventsResponse> {
  const response = await fetch(`${API_URL}/api/events?limit=50`);

  if (!response.ok) {
    throw new Error("Erro ao carregar eventos");
  }

  return response.json();
}
