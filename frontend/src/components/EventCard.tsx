import { type NoiseWatchEvent } from "../services/api";

interface EventCardProps {
  event: NoiseWatchEvent;
}

function formatAlgorithm(algorithm: NoiseWatchEvent["algorithm"]) {
  if (algorithm === "RMS_SIMPLE") return "RMS Simple";
  if (algorithm === "RMS_TWO_STAGE") return "RMS Two-Stage";
  return "Não informado";
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="event-card">
      <img src={event.imageUrl} alt="Evidência capturada pelo NoiseWatch" />

      <div className="event-card-content">
        <div className="event-card-header">
          <strong>{formatAlgorithm(event.algorithm)}</strong>
          <span>{event.status}</span>
        </div>

        <p>
          <b>Data:</b> {new Date(event.createdAt).toLocaleString("pt-BR")}
        </p>

        <p>
          <b>RMS:</b> {event.rms ?? "não informado"}
        </p>

        <p>
          <b>Limiar:</b> {event.threshold ?? "não informado"}
        </p>

        <p>
          <b>Latência:</b>{" "}
          {event.latencyUs ? `${event.latencyUs} µs` : "não informada"}
        </p>
      </div>
    </article>
  );
}
