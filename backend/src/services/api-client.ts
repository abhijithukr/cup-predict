import { config } from '../config';

interface ApiEvent {
  id: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: { current: number | null; display: number | null; period1?: number; period2?: number; normaltime?: number };
  awayScore: { current: number | null; display: number | null; period1?: number; period2?: number; normaltime?: number };
  startTimestamp: number;
  status: { code: number; description: string; type: string };
  tournament: {
    name: string;
    uniqueTournament: { id: number; name: string; slug: string };
  };
  roundInfo: { round: number };
  season: { id: number; name: string };
}

interface ApiResponse {
  events: ApiEvent[];
}

async function fetchFromApi(path: string): Promise<ApiResponse | null> {
  const url = `https://${config.rapidApiHost}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': config.rapidApiHost,
        'x-rapidapi-key': config.rapidApiKey,
      },
    });
    if (!res.ok) {
      console.warn(`API ${res.status} for ${path}`);
      return null;
    }
    return (await res.json()) as ApiResponse;
  } catch (err) {
    console.error(`API fetch error for ${path}:`, err);
    return null;
  }
}

export async function getRoundEvents(round: number) {
  return fetchFromApi(`/api/v1/unique-tournament/16/season/58210/events/round/${round}`);
}

export async function getScheduledEvents(date: string) {
  return fetchFromApi(`/api/v1/sport/football/scheduled-events/${date}`);
}

export async function getLiveEvents() {
  return fetchFromApi('/api/v1/sport/football/events/live');
}

export type { ApiEvent, ApiResponse };
