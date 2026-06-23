const BASE = 'https://sportscore.com';

async function fetchFromSportScore(path: string) {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) {
      console.warn(`SportScore ${res.status} for ${path}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`SportScore fetch error for ${path}:`, err);
    return null;
  }
}

export async function getAllMatches() {
  return fetchFromSportScore('/api/widget/matches/?sport=football&limit=200');
}

export async function getFifaStandings() {
  return fetchFromSportScore('/api/widget/standings/?sport=football&slug=fifa-world-cup');
}

export async function getMatchDetail(slug: string) {
  return fetchFromSportScore(`/api/widget/match/?sport=football&slug=${slug}`);
}

export async function getTeamMatches(teamSlug: string) {
  return fetchFromSportScore(`/api/widget/team/?sport=football&slug=${teamSlug}&limit=10`);
}
