import { useEffect, useState } from "react";
import { EventCard } from "../components/EventCard";
import { listEvents, type NoiseWatchEvent } from "../services/api";

export function EventsPage() {
  const [events, setEvents] = useState<NoiseWatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const response = await listEvents();
      setEvents(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <main className="page">
      <header className="hero">
        <div>
          <span className="eyebrow">NoiseWatch</span>
          <h1>Eventos detectados</h1>
          <p>
            Visualização das imagens enviadas pelo ESP32-CAM após detecção
            sonora.
          </p>
        </div>

        <button onClick={loadEvents}>Atualizar</button>
      </header>

      {loading && <p className="status-message">Carregando eventos...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="status-message">Nenhum evento recebido ainda.</p>
      )}

      <section className="events-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>
    </main>
  );
}
